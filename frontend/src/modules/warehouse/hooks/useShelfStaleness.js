/**
 * useShelfStaleness
 *
 * Detecta cuando el cache del mapa 3D se vuelve stale (otro usuario
 * movió muestras mientras el nuestro estaba en modo drag-en-grupo).
 *
 * Estrategia: polling cada 30s al endpoint /warehouse/:id/map,
 * comparando `lastUpdated` o el total de samples con el snapshot inicial.
 * Si difiere, marca isStale=true.
 *
 * @param {string|number} shelfId
 * @param {{lastUpdated?:string,samples?:Array}} mapData - snapshot actual
 * @returns {{ isStale: boolean, ackRefresh: () => void, lastCheck: Date|null }}
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { warehouseAPI } from '../../../services/api';

const POLL_INTERVAL_MS = 30000;

export const useShelfStaleness = (shelfId, mapData) => {
  const [isStale, setIsStale] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const lastSignatureRef = useRef(null);

  const computeSignature = useCallback((data) => {
    if (!data) return null;
    if (data.lastUpdated) return data.lastUpdated;
    if (Array.isArray(data.samples)) {
      return data.samples
        .map((s) => `${s.id}:${s.position_x}:${s.position_y}:${s.position_z}:${s.status}`)
        .join('|');
    }
    return null;
  }, []);

  useEffect(() => {
    lastSignatureRef.current = computeSignature(mapData);
    setIsStale(false);
  }, [shelfId, mapData, computeSignature]);

  useEffect(() => {
    if (!shelfId) return undefined;
    const tick = async () => {
      try {
        const res = await warehouseAPI.getShelfMap(shelfId);
        const data = res?.data?.data;
        const sig = computeSignature(data);
        setLastCheck(new Date());
        if (lastSignatureRef.current && sig && sig !== lastSignatureRef.current) {
          setIsStale(true);
        }
      } catch {
        // Silent: el polling es best-effort. No romper la UI si falla.
      }
    };
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [shelfId, computeSignature]);

  const ackRefresh = useCallback(() => {
    lastSignatureRef.current = lastSignatureRef.current; // mantiene signature
    setIsStale(false);
  }, []);

  return { isStale, ackRefresh, lastCheck };
};

export default useShelfStaleness;
