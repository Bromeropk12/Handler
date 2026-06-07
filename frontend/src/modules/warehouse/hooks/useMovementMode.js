/**
 * useMovementMode
 *
 * Hook que gestiona el estado del modo "movimiento" cuando el usuario
 * está eligiendo un destino para una o varias muestras. Es responsable de:
 *
 *  - Mantener las muestras que se están moviendo
 *  - Track del target (x, y, z, shelfId, shelfName)
 *  - Pre-cargar el preview de validez desde el backend
 *  - Cancelar al presionar Esc o cambiar de anaquel
 *  - Limpiar después de confirmar
 *
 * Usa el cache de useGroupPreview para no pedirle al backend dos veces
 * por la misma celda.
 *
 * NOTA: Este hook NO es responsable de ejecutar el movimiento (eso
 * sigue siendo trabajo de useSampleMovement / warehouseAPI.moveGroup).
 * Solo maneja el "wizard" de selección.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useGroupPreview } from './useGroupPreview';

const IDLE = 'idle';
const PICKING = 'picking';

export const useMovementMode = ({
  currentShelfId,
  onConfirm,
  onCancel,
  escToCancel = true,
} = {}) => {
  const [phase, setPhase] = useState(IDLE);
  const [movingSamples, setMovingSamples] = useState([]);
  const [target, setTarget] = useState(null);
  const preview = useGroupPreview();
  const escListenerRef = useRef(null);

  const startMove = useCallback((samples) => {
    if (!samples || samples.length === 0) return;
    setMovingSamples(samples);
    setTarget(null);
    setPhase(PICKING);
  }, []);

  const selectTarget = useCallback((cell) => {
    if (phase !== PICKING) return;
    setTarget({
      x: cell.x,
      y: cell.y,
      z: cell.z,
      shelfId: cell.shelfId || currentShelfId,
      shelfName: cell.shelfName || '',
    });
  }, [phase, currentShelfId]);

  const confirm = useCallback(() => {
    if (phase !== PICKING || !target) return;
    if (onConfirm) onConfirm({ samples: movingSamples, target });
    // El padre debe llamar a reset() después de ejecutar la API.
  }, [phase, target, movingSamples, onConfirm]);

  const cancel = useCallback(() => {
    setPhase(IDLE);
    setMovingSamples([]);
    setTarget(null);
    preview.clearCache();
    if (onCancel) onCancel();
  }, [preview, onCancel]);

  const reset = useCallback(() => {
    setPhase(IDLE);
    setMovingSamples([]);
    setTarget(null);
    preview.clearCache();
  }, [preview]);

  // Esc → cancel
  useEffect(() => {
    if (!escToCancel) return undefined;
    if (phase !== PICKING) return undefined;

    const handler = (e) => {
      if (e.key !== 'Escape') return;
      // Skip si el foco está en un input.
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) return;
      e.preventDefault();
      e.stopPropagation();
      cancel();
    };
    window.addEventListener('keydown', handler, true); // capture phase para ganar prioridad
    escListenerRef.current = handler;
    return () => {
      window.removeEventListener('keydown', handler, true);
      escListenerRef.current = null;
    };
  }, [phase, escToCancel, cancel]);

  return {
    phase,
    isActive: phase === PICKING,
    movingSamples,
    target,
    validCells: preview.cache?.cells || [],
    conflicts: preview.cache?.conflicts || [],
    isLoading: preview.loading,
    startMove,
    selectTarget,
    confirm,
    cancel,
    reset,
    loadPreview: preview.loadPreview,
  };
};

export default useMovementMode;
