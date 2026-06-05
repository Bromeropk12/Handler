/**
 * useGroupPreview
 *
 * Cache local del preview del backend (`POST /preview-move-group`).
 * Maneja requests stale con AbortController + requestId para evitar
 * race conditions (cuando el usuario arrastra rápido, solo aplica
 * la última respuesta).
 *
 * API:
 *   const preview = useGroupPreview();
 *   await preview.loadPreview(sourceShelfId, sampleIds, targetShelfId);
 *   preview.getCellValidity(x, y, z) → 'valid' | 'invalid' | 'unknown'
 *   preview.clearCache();
 *
 * @returns {{
 *   cache: object|null,
 *   loading: boolean,
 *   error: Error|null,
 *   loadPreview: (sourceShelfId, sampleIds, targetShelfId) => Promise<void>,
 *   getCellValidity: (x, y, z) => 'valid'|'invalid'|'unknown',
 *   clearCache: () => void
 * }}
 */
import { useState, useRef, useCallback } from 'react';
import { warehouseAPI } from '../../../services/api';

export const useGroupPreview = () => {
  const [cache, setCache] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const requestIdRef = useRef(0);

  const loadPreview = useCallback(async (sourceShelfId, sampleIds, targetShelfId) => {
    if (!sourceShelfId || !Array.isArray(sampleIds) || sampleIds.length === 0) {
      setCache(null);
      return;
    }
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
    const myRequestId = requestIdRef.current + 1;
    requestIdRef.current = myRequestId;

    setLoading(true);
    setError(null);
    try {
      const res = await warehouseAPI.previewGroupMove(
        sourceShelfId,
        {
          sample_ids: sampleIds,
          target_shelf_id: targetShelfId || sourceShelfId,
        },
        { signal: controller.signal }
      );

      if (myRequestId === requestIdRef.current) {
        setCache(res?.data?.data || null);
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        return; // Cancelado por request más reciente, ignorar
      }
      if (myRequestId === requestIdRef.current) {
        setError(err);
        setCache(null);
      }
    } finally {
      if (myRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const getCellValidity = useCallback(
    (x, y, z) => {
      if (!cache || !Array.isArray(cache.cells)) return 'unknown';
      const cell = cache.cells.find(
        (c) =>
          c.x === x &&
          c.y === y &&
          c.z === z
      );
      if (!cell) return 'unknown';
      return cell.compatible ? 'valid' : 'invalid';
    },
    [cache]
  );

  const clearCache = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setCache(null);
    setError(null);
    setLoading(false);
  }, []);

  return { cache, loading, error, loadPreview, getCellValidity, clearCache };
};

export default useGroupPreview;
