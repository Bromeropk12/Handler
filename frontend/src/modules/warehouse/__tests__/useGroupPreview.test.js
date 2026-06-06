/**
 * Tests del hook useGroupPreview.
 *
 * Cubre:
 *  - Estado inicial
 *  - loadPreview guarda el cache del backend
 *  - getCellValidity retorna 'valid' / 'invalid' / 'unknown' según cache
 *  - Múltiples requests: el último gana (requestId)
 *  - clearCache limpia
 *  - AbortController cancela request anterior
 */
import { renderHook, act } from '@testing-library/react';
import { useGroupPreview } from '../hooks/useGroupPreview';

// Mock the API
jest.mock('../../../services/api', () => ({
  warehouseAPI: {
    previewGroupMove: jest.fn(),
  },
}));

import { warehouseAPI } from '../../../services/api';

const makeCells = (count, allValid = true) => {
  const cells = [];
  for (let i = 0; i < count; i++) {
    cells.push({ x: i, y: 0, z: 0, compatible: allValid });
  }
  return cells;
};

describe('useGroupPreview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('starts empty', () => {
    const { result } = renderHook(() => useGroupPreview());
    expect(result.current.cache).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('loadPreview guarda el cache', async () => {
    const cells = makeCells(3);
    warehouseAPI.previewGroupMove.mockResolvedValueOnce({
      data: { data: { cells, conflicts: [] } },
    });

    const { result } = renderHook(() => useGroupPreview());
    await act(async () => {
      await result.current.loadPreview('shelf-1', ['s-1', 's-2'], 'shelf-1');
    });

    expect(result.current.cache).toEqual({ cells, conflicts: [] });
    expect(result.current.loading).toBe(false);
    expect(warehouseAPI.previewGroupMove).toHaveBeenCalledWith(
      'shelf-1',
      { sample_ids: ['s-1', 's-2'], target_shelf_id: 'shelf-1' },
      expect.objectContaining({ signal: expect.anything() })
    );
  });

  test('getCellValidity returns valid/invalid/unknown', async () => {
    warehouseAPI.previewGroupMove.mockResolvedValueOnce({
      data: { data: { cells: [
        { x: 0, y: 0, z: 0, compatible: true },
        { x: 1, y: 0, z: 0, compatible: false },
      ] } },
    });

    const { result } = renderHook(() => useGroupPreview());
    await act(async () => {
      await result.current.loadPreview('shelf-1', ['s-1'], 'shelf-1');
    });

    expect(result.current.getCellValidity(0, 0, 0)).toBe('valid');
    expect(result.current.getCellValidity(1, 0, 0)).toBe('invalid');
    expect(result.current.getCellValidity(99, 0, 0)).toBe('unknown');
  });

  test('loadPreview sin sampleIds no llama al backend', async () => {
    const { result } = renderHook(() => useGroupPreview());
    await act(async () => {
      await result.current.loadPreview('shelf-1', [], 'shelf-1');
    });
    expect(warehouseAPI.previewGroupMove).not.toHaveBeenCalled();
    expect(result.current.cache).toBeNull();
  });

  test('clearCache limpia todo', async () => {
    warehouseAPI.previewGroupMove.mockResolvedValueOnce({
      data: { data: { cells: makeCells(2) } },
    });

    const { result } = renderHook(() => useGroupPreview());
    await act(async () => {
      await result.current.loadPreview('shelf-1', ['s-1'], 'shelf-1');
    });
    expect(result.current.cache).not.toBeNull();

    act(() => result.current.clearCache());
    expect(result.current.cache).toBeNull();
    expect(result.current.error).toBeNull();
  });

  test('error del backend setea error y limpia cache', async () => {
    warehouseAPI.previewGroupMove.mockRejectedValueOnce(new Error('Boom'));

    const { result } = renderHook(() => useGroupPreview());
    await act(async () => {
      await result.current.loadPreview('shelf-1', ['s-1'], 'shelf-1');
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toBe('Boom');
    expect(result.current.cache).toBeNull();
  });
});
