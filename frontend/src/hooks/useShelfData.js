import { useState, useCallback } from 'react';
import { warehouseAPI } from '../services/api';

/**
 * Hook personalizado para gestión de datos de anaqueles
 * Maneja el estado y las operaciones relacionadas con anaqueles
 */
export const useShelfData = () => {
  const [shelves, setShelves] = useState([]);
  const [currentShelf, setCurrentShelf] = useState(null);
  const [currentMap, setCurrentMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función para cargar todos los anaqueles con filtros
  const fetchShelves = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await warehouseAPI.getShelves(filters);
      setShelves(response.data.data.shelves);
    } catch (err) {
      setError(err.message || 'Error al cargar anaqueles');
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para cargar un anaquel específico
  const fetchShelf = useCallback(async shelfId => {
    try {
      setLoading(true);
      setError(null);

      const response = await warehouseAPI.getShelf(shelfId);
      setCurrentShelf(response.data.data.shelf);
      return response.data.data.shelf;
    } catch (err) {
      setError(err.message || 'Error al cargar anaquel');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para cargar el mapa de un anaquel
  const fetchShelfMap = useCallback(async shelfId => {
    try {
      setLoading(true);
      setError(null);

      const response = await warehouseAPI.getShelfMap(shelfId);
      setCurrentMap(response.data.data);
      return response.data.data;
    } catch (err) {
      setError(err.message || 'Error al cargar mapa del anaquel');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para colocar una muestra en el mapa
  const placeSample = useCallback(
    async (shelfId, sampleData) => {
      try {
        setLoading(true);
        setError(null);

        await warehouseAPI.placeSample(shelfId, sampleData);

        // Recargar el mapa después de colocar la muestra
        await fetchShelfMap(shelfId);
      } catch (err) {
        setError(err.message || 'Error al colocar muestra');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchShelfMap]
  );

  // Función para mover una muestra
  const moveSample = useCallback(
    async (shelfId, moveData) => {
      try {
        setLoading(true);
        setError(null);

        await warehouseAPI.moveSample(shelfId, moveData);

        // Recargar el mapa después de mover la muestra
        await fetchShelfMap(shelfId);
      } catch (err) {
        setError(err.message || 'Error al mover muestra');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchShelfMap]
  );

  // Función para remover una muestra del mapa
  const removeSample = useCallback(
    async (shelfId, sampleData) => {
      try {
        setLoading(true);
        setError(null);

        await warehouseAPI.removeSample(shelfId, sampleData);

        // Recargar el mapa después de remover la muestra
        await fetchShelfMap(shelfId);
      } catch (err) {
        setError(err.message || 'Error al remover muestra');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchShelfMap]
  );

  // Función para crear un nuevo anaquel
  const createShelf = useCallback(async shelfData => {
    try {
      setLoading(true);
      setError(null);

      const response = await warehouseAPI.createShelf(shelfData);
      const newShelf = response.data.data.shelf;

      // Agregar el nuevo anaquel a la lista
      setShelves(prev => [...prev, newShelf]);

      return newShelf;
    } catch (err) {
      setError(err.message || 'Error al crear anaquel');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para actualizar un anaquel
  const updateShelf = useCallback(
    async (shelfId, updateData) => {
      try {
        setLoading(true);
        setError(null);

        const response = await warehouseAPI.updateShelf(shelfId, updateData);
        const updatedShelf = response.data.data.shelf;

        // Actualizar el anaquel en la lista
        setShelves(prev => prev.map(shelf => (shelf.id === shelfId ? updatedShelf : shelf)));

        // Si es el anaquel actual, actualizarlo también
        if (currentShelf?.id === shelfId) {
          setCurrentShelf(updatedShelf);
        }

        return updatedShelf;
      } catch (err) {
        setError(err.message || 'Error al actualizar anaquel');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentShelf]
  );

  // Función para eliminar un anaquel
  const deleteShelf = useCallback(
    async shelfId => {
      try {
        setLoading(true);
        setError(null);

        await warehouseAPI.deleteShelf(shelfId);

        // Remover el anaquel de la lista
        setShelves(prev => prev.filter(shelf => shelf.id !== shelfId));

        // Si es el anaquel actual, limpiarlo
        if (currentShelf?.id === shelfId) {
          setCurrentShelf(null);
          setCurrentMap(null);
        }
      } catch (err) {
        setError(err.message || 'Error al eliminar anaquel');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentShelf]
  );

  // Función para limpiar errores
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Función para resetear el estado
  const reset = useCallback(() => {
    setShelves([]);
    setCurrentShelf(null);
    setCurrentMap(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    // Estado
    shelves,
    currentShelf,
    currentMap,
    loading,
    error,

    // Acciones
    fetchShelves,
    fetchShelf,
    fetchShelfMap,
    placeSample,
    moveSample,
    removeSample,
    createShelf,
    updateShelf,
    deleteShelf,
    clearError,
    reset,

    // Utilidades
    hasShelves: shelves.length > 0,
    currentShelfOccupancy: currentShelf
      ? Math.round(((currentShelf.occupied_count || 0) / currentShelf.total_capacity) * 100)
      : 0,
    hasErrors: !!error,
    isLoading: loading,
  };
};
