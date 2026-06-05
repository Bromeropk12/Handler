/**
 * useSampleSelection
 *
 * Manejo de selección de muestras (single + group) en el módulo
 * Almacén. Restricciones de drag-en-grupo:
 *  - Solo se pueden agrupar muestras del mismo `global_sample_id`
 *    (mismo producto, mismo lote, mismo SGA class).
 *  - Solo 'stored' (no 'dispensed' / 'consumed' / etc.).
 *  - Mismas dimensiones (1x1x1 con 1x1x1; 2x1x1 con 2x1x1; etc.).
 *  - Máximo 10 muestras por grupo.
 *  - Multi-shelf: solo se permite si todas están en el mismo anaquel.
 *
 * Si alguna validación falla, emite `rejectionEvent` para que la UI
 * muestre el modal correspondiente (TypeMismatchModal, etc.).
 *
 * @returns {{
 *   selectedSamples: Array,
 *   count: number,
 *   selectionType: {id,name,dangerClass,dimensions}|null,
 *   rejectionEvent: object|null,
 *   clearRejection: () => void,
 *   toggleSample: (sample) => void,
 *   selectAll: (samples) => void,
 *   clearSelection: () => void,
 *   isSelected: (id) => boolean,
 *   selectedList: Array
 * }}
 */
import { useState, useCallback, useMemo, useRef } from 'react';

const MAX_GROUP_SIZE = 10;

const buildSelectionType = (sample) => ({
  id: sample.global_sample_id,
  name: sample.global_sample_name || sample.name || 'Muestra',
  lot: sample.lot || null,
  dangerClass: sample.ghs_danger_class || 'Sin Riesgo',
  dimensions: `${sample.width || 1}x${sample.height || 1}x${sample.depth || 1}`,
  shelfId: sample.shelf_id || null,
});

export const useSampleSelection = () => {
  const [selectedSamples, setSelectedSamples] = useState(new Map());
  const [selectionType, setSelectionType] = useState(null);
  const [rejectionEvent, setRejectionEvent] = useState(null);

  // Refs para evitar stale closures dentro de toggleSample
  const selectionTypeRef = useRef(selectionType);
  selectionTypeRef.current = selectionType;

  const emitRejection = useCallback((event) => {
    setRejectionEvent({ ...event, _ts: Date.now() });
  }, []);

  const clearRejection = useCallback(() => {
    setRejectionEvent(null);
  }, []);

  const toggleSample = useCallback(
    (sample) => {
      if (!sample || !sample.id) return;

      setSelectedSamples((prev) => {
        const currentCount = prev.size;
        const currentType = selectionTypeRef.current;

        // 1) Deseleccionar
        if (prev.has(sample.id)) {
          const newMap = new Map(prev);
          newMap.delete(sample.id);
          if (newMap.size === 0) {
            setSelectionType(null);
          }
          return newMap;
        }

        // 2) Selección vacía → agregar libre (con validación de status)
        if (currentCount === 0) {
          if (sample.status && sample.status !== 'stored') {
            emitRejection({ type: 'status', sample });
            return prev;
          }
          setSelectionType(buildSelectionType(sample));
          return new Map([[sample.id, sample]]);
        }

        // 3) Límite de 10
        if (currentCount >= MAX_GROUP_SIZE) {
          emitRejection({ type: 'limit', currentCount });
          return prev;
        }

        // 4) Validar tipo (mismo global_sample_id)
        if (sample.global_sample_id !== currentType?.id) {
          emitRejection({
            type: 'type',
            currentType,
            newSample: sample,
          });
          return prev;
        }

        // 5) Validar dimensiones
        const sampleDims = `${sample.width || 1}x${sample.height || 1}x${sample.depth || 1}`;
        if (sampleDims !== currentType?.dimensions) {
          emitRejection({
            type: 'dimension',
            currentDims: currentType.dimensions,
            newDims: sampleDims,
            newSample: sample,
          });
          return prev;
        }

        // 6) Validar status
        if (sample.status && sample.status !== 'stored') {
          emitRejection({ type: 'status', sample });
          return prev;
        }

        // 7) Validar mismo shelf (multi-shelf no permitido en grupo)
        if (
          currentType?.shelfId &&
          sample.shelf_id &&
          sample.shelf_id !== currentType.shelfId
        ) {
          emitRejection({
            type: 'multiShelf',
            currentShelfId: currentType.shelfId,
            newShelfId: sample.shelf_id,
          });
          return prev;
        }

        // 8) OK: agregar
        const newMap = new Map(prev);
        newMap.set(sample.id, sample);
        return newMap;
      });
    },
    [emitRejection]
  );

  const selectAll = useCallback((samples) => {
    if (!Array.isArray(samples) || samples.length === 0) {
      setSelectedSamples(new Map());
      setSelectionType(null);
      return;
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
        if (s.global_sample_id !== firstType.id) {
          rejected = true;
          continue;
        }
        const dims = `${s.width || 1}x${s.height || 1}x${s.depth || 1}`;
        if (dims !== firstType.dimensions) {
          rejected = true;
          continue;
        }
        if (firstType.shelfId && s.shelf_id && s.shelf_id !== firstType.shelfId) {
          rejected = true;
          continue;
        }
      }
      newMap.set(s.id, s);
    }
    setSelectedSamples(newMap);
    setSelectionType(newMap.size > 0 ? firstType : null);
    if (rejected) {
      emitRejection({ type: 'partial', accepted: newMap.size });
    }
  }, [emitRejection]);

  const clearSelection = useCallback(() => {
    setSelectedSamples(new Map());
    setSelectionType(null);
    setRejectionEvent(null);
  }, []);

  const isSelected = useCallback(
    (sampleId) => selectedSamples.has(sampleId),
    [selectedSamples]
  );

  const selectedList = useMemo(
    () => Array.from(selectedSamples.values()),
    [selectedSamples]
  );

  return {
    selectedSamples: selectedList,
    count: selectedSamples.size,
    selectionType,
    rejectionEvent,
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
