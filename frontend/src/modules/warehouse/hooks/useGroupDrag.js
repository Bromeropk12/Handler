/**
 * useGroupDrag
 *
 * Orquestador del estado de drag-en-grupo.
 *
 * Responsabilidades:
 *  - Mantener dragState (isDragging, anchorSampleId, currentOffset, hoveredCell, etc.).
 *  - Listeners globales: ESC, visibilitychange, resize, prefers-reduced-motion.
 *  - Decidir qué pasa al soltar (onDragEnd):
 *      • Soltar fuera del canvas → shake + cancel
 *      • Soltar en celda inválida → shake + cancel
 *      • Soltar en celda válida → invoca onDropValid(cell)
 *
 * @param {object} args
 * @param {Array} args.groupSamples         - muestras del grupo (referencia)
 * @param {Function} args.onDropValid       - (cell, groupSamples) => void
 * @param {Function} [args.onDropInvalid]   - () => void (para shake)
 * @param {Function} [args.onShake]         - () => void (para animación)
 * @param {Function} [args.onChangeShelf]   - () => void (cancela drag si cambia shelf)
 *
 * @returns {{
 *   dragState: object,
 *   isShaking: boolean,
 *   reducedMotion: boolean,
 *   startDrag: (sample) => void,
 *   updateDrag: (offset) => void,
 *   setHoveredCell: (cell, validity) => void,
 *   endDrag: () => void,
 *   cancelDrag: () => void,
 *   resetState: () => void
 * }}
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

const initialDragState = {
  isDragging: false,
  anchorSampleId: null,
  currentOffset: { dx: 0, dy: 0, dz: 0 },
  hoveredCell: null,
  hoveredValidity: null, // 'valid' | 'invalid' | null
  hoveredConflicts: [],
};

export const useGroupDrag = ({
  groupSamples,
  onDropValid,
  onDropInvalid,
  onShake,
  onChangeShelf,
} = {}) => {
  const [dragState, setDragState] = useState(initialDragState);
  const [isShaking, setIsShaking] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const groupSamplesRef = useRef(groupSamples);
  useEffect(() => {
    groupSamplesRef.current = groupSamples;
  }, [groupSamples]);

  const triggerShake = useCallback(() => {
    if (reducedMotion) return;
    setIsShaking(true);
    if (onShake) onShake();
    setTimeout(() => setIsShaking(false), 400);
  }, [reducedMotion, onShake]);

  const cancelDrag = useCallback(() => {
    setDragState(initialDragState);
  }, []);

  const resetState = useCallback(() => {
    setDragState(initialDragState);
  }, []);

  const startDrag = useCallback(
    (sample) => {
      if (!sample || !sample.id) return;
      setDragState({
        isDragging: true,
        anchorSampleId: sample.id,
        currentOffset: { dx: 0, dy: 0, dz: 0 },
        hoveredCell: null,
        hoveredValidity: null,
        hoveredConflicts: [],
      });
    },
    []
  );

  const updateDrag = useCallback((offset) => {
    setDragState((prev) => ({
      ...prev,
      currentOffset: {
        dx: offset?.dx ?? prev.currentOffset.dx,
        dy: offset?.dy ?? prev.currentOffset.dy,
        dz: offset?.dz ?? prev.currentOffset.dz,
      },
    }));
  }, []);

  const setHoveredCell = useCallback((cell, validity, conflicts = []) => {
    setDragState((prev) => ({
      ...prev,
      hoveredCell: cell,
      hoveredValidity: validity,
      hoveredConflicts: conflicts,
    }));
  }, []);

  const endDrag = useCallback(() => {
    setDragState((prev) => {
      if (!prev.isDragging) return prev;

      if (!prev.hoveredCell) {
        triggerShake();
        return initialDragState;
      }
      if (prev.hoveredValidity === 'invalid') {
        triggerShake();
        if (onDropInvalid) onDropInvalid();
        return initialDragState;
      }
      if (prev.hoveredValidity === 'valid') {
        if (onDropValid) {
          onDropValid(prev.hoveredCell, groupSamplesRef.current || []);
        }
        return initialDragState;
      }
      // hoveredValidity === 'unknown' o null
      triggerShake();
      return initialDragState;
    });
  }, [triggerShake, onDropValid, onDropInvalid]);

  // Listeners globales
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && dragState.isDragging) {
        cancelDrag();
      }
    };
    const onVisibility = () => {
      if (document.hidden && dragState.isDragging) {
        cancelDrag();
      }
    };
    const onResize = () => {
      if (dragState.isDragging) {
        cancelDrag();
      }
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
    };
  }, [dragState.isDragging, cancelDrag]);

  // Notifica al padre cuando cambia el shelf (cross-shelf mid-drag cancela)
  useEffect(() => {
    if (dragState.isDragging && onChangeShelf) {
      onChangeShelf();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragState.isDragging]);

  return {
    dragState,
    isShaking,
    reducedMotion,
    startDrag,
    updateDrag,
    setHoveredCell,
    endDrag,
    cancelDrag,
    resetState,
    triggerShake,
  };
};

export default useGroupDrag;
