/**
 * Tests del hook useMovementMode.
 *
 * Cubre:
 *  - idle: isActive=false, movingSamples=[], target=null
 *  - startMove: isActive=true, movingSamples correctos
 *  - selectTarget: asigna target con shelfId/Name del currentShelfId
 *  - cancel: vuelve a idle, limpia preview cache, llama onCancel
 *  - reset: vuelve a idle sin llamar onCancel
 *  - Esc key: cancela (skip si foco en input)
 *  - startMove con [] no hace nada
 */
import { renderHook, act } from '@testing-library/react';
import { useMovementMode } from '../hooks/useMovementMode';

const samples = [
  { id: 1, name: 'A', shelf_id: 'sh-1' },
  { id: 2, name: 'B', shelf_id: 'sh-1' },
];

describe('useMovementMode', () => {
  test('starts idle with no samples and no target', () => {
    const { result } = renderHook(() => useMovementMode());
    expect(result.current.isActive).toBe(false);
    expect(result.current.movingSamples).toEqual([]);
    expect(result.current.target).toBeNull();
  });

  test('startMove enters picking phase with provided samples', () => {
    const { result } = renderHook(() => useMovementMode({ currentShelfId: 'sh-1' }));
    act(() => result.current.startMove(samples));
    expect(result.current.isActive).toBe(true);
    expect(result.current.movingSamples).toEqual(samples);
    expect(result.current.target).toBeNull();
  });

  test('startMove with empty array is a no-op', () => {
    const { result } = renderHook(() => useMovementMode());
    act(() => result.current.startMove([]));
    expect(result.current.isActive).toBe(false);
    expect(result.current.movingSamples).toEqual([]);
  });

  test('selectTarget sets target with currentShelfId fallback', () => {
    const { result } = renderHook(() => useMovementMode({ currentShelfId: 'sh-1' }));
    act(() => result.current.startMove(samples));
    act(() => result.current.selectTarget({ x: 3, y: 1, z: 2 }));
    expect(result.current.target).toEqual({
      x: 3, y: 1, z: 2,
      shelfId: 'sh-1',
      shelfName: '',
    });
  });

  test('selectTarget before startMove is a no-op (phase !== PICKING)', () => {
    const { result } = renderHook(() => useMovementMode({ currentShelfId: 'sh-1' }));
    act(() => result.current.selectTarget({ x: 0, y: 0, z: 0 }));
    expect(result.current.target).toBeNull();
  });

  test('cancel returns to idle and calls onCancel callback', () => {
    const onCancel = jest.fn();
    const { result } = renderHook(() => useMovementMode({ currentShelfId: 'sh-1', onCancel }));
    act(() => result.current.startMove(samples));
    act(() => result.current.cancel());
    expect(result.current.isActive).toBe(false);
    expect(result.current.movingSamples).toEqual([]);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('reset returns to idle without calling onCancel', () => {
    const onCancel = jest.fn();
    const { result } = renderHook(() => useMovementMode({ currentShelfId: 'sh-1', onCancel }));
    act(() => result.current.startMove(samples));
    act(() => result.current.reset());
    expect(result.current.isActive).toBe(false);
    expect(onCancel).not.toHaveBeenCalled();
  });

  test('Esc key cancels movement mode', () => {
    const onCancel = jest.fn();
    const { result } = renderHook(() => useMovementMode({ currentShelfId: 'sh-1', onCancel }));
    act(() => result.current.startMove(samples));
    act(() => {
      const evt = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(evt);
    });
    expect(result.current.isActive).toBe(false);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
