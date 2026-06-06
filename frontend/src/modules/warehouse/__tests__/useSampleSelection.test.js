/**
 * Tests del hook useSampleSelection.
 *
 * Cubre:
 *  - Selección simple (1 muestra)
 *  - Agrupación hasta 10 (límite)
 *  - Rechazo por tipo distinto (global_sample_id)
 *  - Rechazo por dimensión distinta
 *  - Rechazo por status !== 'stored'
 *  - Rechazo por multi-shelf
 *  - Deselección (toggle off)
 *  - clearSelection
 */
import { renderHook, act } from '@testing-library/react';
import { useSampleSelection } from '../hooks/useSampleSelection';

const makeSample = (overrides = {}) => ({
  id: 's-1',
  global_sample_id: 'gs-1',
  global_sample_name: 'Acetona 99%',
  ghs_danger_class: 'Inflamable',
  width: 1,
  height: 1,
  depth: 1,
  status: 'stored',
  shelf_id: 'shelf-A',
  ...overrides,
});

describe('useSampleSelection', () => {
  test('starts with empty selection', () => {
    const { result } = renderHook(() => useSampleSelection());
    expect(result.current.count).toBe(0);
    expect(result.current.selectedSamples).toEqual([]);
    expect(result.current.selectionType).toBeNull();
    expect(result.current.rejectionEvent).toBeNull();
  });

  test('selects a single stored sample and derives selectionType', () => {
    const { result } = renderHook(() => useSampleSelection());
    const s = makeSample({ id: 's-1' });
    act(() => result.current.toggleSample(s));

    expect(result.current.count).toBe(1);
    expect(result.current.selectedSamples).toHaveLength(1);
    expect(result.current.selectionType).toMatchObject({
      id: 'gs-1',
      name: 'Acetona 99%',
      dangerClass: 'Inflamable',
      dimensions: '1x1x1',
      shelfId: 'shelf-A',
    });
  });

  test('rejects sample with status !== stored', () => {
    const { result } = renderHook(() => useSampleSelection());
    act(() => result.current.toggleSample(makeSample({ id: 's-1', status: 'dispensed' })));

    expect(result.current.count).toBe(0);
    expect(result.current.rejectionEvent?.type).toBe('status');
  });

  test('groups up to 10 samples of same type', () => {
    const { result } = renderHook(() => useSampleSelection());
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.toggleSample(makeSample({ id: `s-${i}` }));
      }
    });
    expect(result.current.count).toBe(10);
    expect(result.current.rejectionEvent).toBeNull();
  });

  test('rejects the 11th sample (limit)', () => {
    const { result } = renderHook(() => useSampleSelection());
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.toggleSample(makeSample({ id: `s-${i}` }));
      }
      result.current.toggleSample(makeSample({ id: 's-11' }));
    });
    expect(result.current.count).toBe(10);
    expect(result.current.rejectionEvent?.type).toBe('limit');
    expect(result.current.rejectionEvent?.currentCount).toBe(10);
  });

  test('rejects sample of different type (global_sample_id mismatch)', () => {
    const { result } = renderHook(() => useSampleSelection());
    act(() => result.current.toggleSample(makeSample({ id: 's-1' })));
    act(() => result.current.toggleSample(makeSample({
      id: 's-2',
      global_sample_id: 'gs-2',
      global_sample_name: 'Metanol',
    })));
    expect(result.current.count).toBe(1);
    expect(result.current.rejectionEvent?.type).toBe('type');
    expect(result.current.rejectionEvent?.newSample?.id).toBe('s-2');
  });

  test('rejects sample of different dimensions', () => {
    const { result } = renderHook(() => useSampleSelection());
    act(() => result.current.toggleSample(makeSample({ id: 's-1' })));
    act(() => result.current.toggleSample(makeSample({
      id: 's-2',
      width: 2, height: 1, depth: 1,
    })));
    expect(result.current.count).toBe(1);
    expect(result.current.rejectionEvent?.type).toBe('dimension');
    expect(result.current.rejectionEvent?.currentDims).toBe('1x1x1');
    expect(result.current.rejectionEvent?.newDims).toBe('2x1x1');
  });

  test('rejects sample from a different shelf (multi-shelf)', () => {
    const { result } = renderHook(() => useSampleSelection());
    act(() => result.current.toggleSample(makeSample({ id: 's-1', shelf_id: 'shelf-A' })));
    act(() => result.current.toggleSample(makeSample({ id: 's-2', shelf_id: 'shelf-B' })));
    expect(result.current.count).toBe(1);
    expect(result.current.rejectionEvent?.type).toBe('multiShelf');
  });

  test('toggles a sample off', () => {
    const { result } = renderHook(() => useSampleSelection());
    act(() => result.current.toggleSample(makeSample({ id: 's-1' })));
    expect(result.current.count).toBe(1);
    act(() => result.current.toggleSample(makeSample({ id: 's-1' })));
    expect(result.current.count).toBe(0);
    expect(result.current.selectionType).toBeNull();
  });

  test('clears selection and rejection', () => {
    const { result } = renderHook(() => useSampleSelection());
    act(() => result.current.toggleSample(makeSample({ id: 's-1' })));
    act(() => result.current.toggleSample(makeSample({ id: 's-2', global_sample_id: 'gs-2' })));
    expect(result.current.rejectionEvent).not.toBeNull();

    act(() => result.current.clearSelection());
    expect(result.current.count).toBe(0);
    expect(result.current.selectionType).toBeNull();
    expect(result.current.rejectionEvent).toBeNull();
  });

  test('isSelected returns correct boolean', () => {
    const { result } = renderHook(() => useSampleSelection());
    act(() => result.current.toggleSample(makeSample({ id: 's-1' })));
    expect(result.current.isSelected('s-1')).toBe(true);
    expect(result.current.isSelected('s-2')).toBe(false);
  });

  test('selectAll skips incompatible samples and emits partial rejection', () => {
    const { result } = renderHook(() => useSampleSelection());
    const samples = [
      makeSample({ id: 's-1' }),
      makeSample({ id: 's-2' }),
      makeSample({ id: 's-3', global_sample_id: 'gs-2' }), // distinto tipo
      makeSample({ id: 's-4', width: 2 }),                 // distinta dim
    ];
    act(() => result.current.selectAll(samples));
    expect(result.current.count).toBe(2);
    expect(result.current.rejectionEvent?.type).toBe('partial');
    expect(result.current.rejectionEvent?.accepted).toBe(2);
  });
});
