/**
 * useSampleSelection
 *
 * Manejo de selección de muestras (single + group). Usa un único
 * useState con un objeto combinado { map, type, rejection } para
 * que las validaciones sean atómicas y los rejects viajen con el
 * state.
 *
 * Restricciones de drag-en-grupo:
 *  - Mismo `global_sample_id`.
 *  - Solo 'stored'.
 *  - Mismas dimensiones.
 *  - Máximo 10 muestras por grupo.
 *  - Multi-shelf no permitido.
 */
import { useState, useCallback, useMemo } from 'react';

const MAX_GROUP_SIZE = 10;

const buildSelectionType = (sample) => ({
  id: sample.global_sample_id,
  name: sample.global_sample_name || sample.name || 'Muestra',
  lot: sample.lot || null,
  dangerClass: sample.ghs_danger_class || 'Sin Riesgo',
  dimensions: `${sample.width || 1}x${sample.height || 1}x${sample.depth || 1}`,
  shelfId: sample.shelf_id || null,
});

const initialState = { map: new Map(), type: null, rejection: null };

function computeToggle(state, sample) {
  const { map, type: currentType } = state;

  // 1) Deseleccionar
  if (map.has(sample.id)) {
    const next = new Map(map);
    next.delete(sample.id);
    return {
      map: next,
      type: next.size === 0 ? null : currentType,
      rejection: null,
    };
  }

  const currentCount = map.size;

  // 2) Vacía
  if (currentCount === 0) {
    if (sample.status && sample.status !== 'stored') {
      return {
        ...state,
        rejection: { type: 'status', sample, _ts: Date.now() },
      };
    }
    return {
      map: new Map([[sample.id, sample]]),
      type: buildSelectionType(sample),
      rejection: null,
    };
  }

  // 3) Límite
  if (currentCount >= MAX_GROUP_SIZE) {
    return {
      ...state,
      rejection: { type: 'limit', currentCount, _ts: Date.now() },
    };
  }

  // 4) Tipo
  if (sample.global_sample_id !== currentType?.id) {
    return {
      ...state,
      rejection: {
        type: 'type',
        currentType,
        newSample: sample,
        _ts: Date.now(),
      },
    };
  }

  // 5) Dimensiones
  const sampleDims = `${sample.width || 1}x${sample.height || 1}x${sample.depth || 1}`;
  if (sampleDims !== currentType?.dimensions) {
    return {
      ...state,
      rejection: {
        type: 'dimension',
        currentDims: currentType.dimensions,
        newDims: sampleDims,
        newSample: sample,
        _ts: Date.now(),
      },
    };
  }

  // 6) Status
  if (sample.status && sample.status !== 'stored') {
    return {
      ...state,
      rejection: { type: 'status', sample, _ts: Date.now() },
    };
  }

  // 7) Multi-shelf
  if (
    currentType?.shelfId &&
    sample.shelf_id &&
    sample.shelf_id !== currentType.shelfId
  ) {
    return {
      ...state,
      rejection: {
        type: 'multiShelf',
        currentShelfId: currentType.shelfId,
        newShelfId: sample.shelf_id,
        _ts: Date.now(),
      },
    };
  }

  // 8) OK
  const next = new Map(map);
  next.set(sample.id, sample);
  return { map: next, type: currentType, rejection: null };
}

function computeSelectAll(state, samples) {
  if (!Array.isArray(samples) || samples.length === 0) {
    return { map: new Map(), type: null, rejection: null };
  }
  const newMap = new Map();
  let firstType = null;
  let rejected = false;
  for (const s of samples) {
    if (newMap.size >= MAX_GROUP_SIZE) break;
    if (s.status && s.status !== 'stored') continue;
    if (!firstType) {
      firstType = buildSelectionType(s);
    } else {
      if (s.global_sample_id !== firstType.id) { rejected = true; continue; }
      const dims = `${s.width || 1}x${s.height || 1}x${s.depth || 1}`;
      if (dims !== firstType.dimensions) { rejected = true; continue; }
      if (firstType.shelfId && s.shelf_id && s.shelf_id !== firstType.shelfId) {
        rejected = true;
        continue;
      }
    }
    newMap.set(s.id, s);
  }
  return {
    map: newMap,
    type: newMap.size > 0 ? firstType : null,
    rejection: rejected
      ? { type: 'partial', accepted: newMap.size, _ts: Date.now() }
      : null,
  };
}

export const useSampleSelection = () => {
  const [state, setState] = useState(initialState);

  const toggleSample = useCallback((sample) => {
    setState((prev) => computeToggle(prev, sample));
  }, []);

  const selectAll = useCallback((samples) => {
    setState((prev) => computeSelectAll(prev, samples));
  }, []);

  const clearSelection = useCallback(() => {
    setState(initialState);
  }, []);

  const clearRejection = useCallback(() => {
    setState((prev) => ({ ...prev, rejection: null }));
  }, []);

  const isSelected = useCallback(
    (sampleId) => state.map.has(sampleId),
    [state.map]
  );

  const selectedList = useMemo(
    () => Array.from(state.map.values()),
    [state.map]
  );

  return {
    selectedSamples: selectedList,
    count: state.map.size,
    selectionType: state.type,
    rejectionEvent: state.rejection,
    clearRejection,
    toggleSample,
    selectAll,
    clearSelection,
    isSelected,
    selectedList,
    MAX_GROUP_SIZE,
  };
};

export default useSampleSelection;
