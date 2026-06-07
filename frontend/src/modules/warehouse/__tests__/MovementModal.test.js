import { render, screen, fireEvent } from '@testing-library/react';
import MovementModal from '../components/ui/MovementModal';

const target = { x: 3, y: 1, z: 2, shelfId: 'shelf-1', shelfName: 'Anaquel A' };

describe('MovementModal', () => {
  test('renders null when no target or no samples', () => {
    const { container: c1 } = render(<MovementModal samples={[]} target={target} />);
    expect(c1.firstChild).toBeNull();
    const { container: c2 } = render(<MovementModal samples={[{ id: 1 }]} target={null} />);
    expect(c2.firstChild).toBeNull();
  });

  test('renders count and position meta for single sample', () => {
    render(<MovementModal samples={[{ id: 7 }]} target={target} />);
    const modal = screen.getByTestId('movement-modal');
    expect(modal).toBeTruthy();
    expect(modal.textContent).toContain('S-0007');
    expect(modal.textContent).toContain('(3, 1, 2)');
  });

  test('shows cross-shelf badge when target.shelfId !== currentShelfId', () => {
    render(
      <MovementModal
        samples={[{ id: 1 }]}
        target={{ x: 0, y: 0, z: 0, shelfId: 'shelf-2', shelfName: 'B' }}
        currentShelfId="shelf-1"
      />
    );
    expect(screen.getByTestId('movement-modal').textContent).toContain('cruzado');
  });

  test('disables confirm button when there are conflicts', () => {
    render(
      <MovementModal
        samples={[{ id: 1 }, { id: 2 }]}
        target={target}
        conflicts={[{ id: 1 }]}
      />
    );
    const btn = screen.getByTestId('movement-modal-confirm');
    expect(btn.disabled).toBe(true);
  });

  test('calls onConfirm and onCancel when buttons clicked', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(
      <MovementModal
        samples={[{ id: 1 }]}
        target={target}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByTestId('movement-modal-confirm'));
    fireEvent.click(screen.getByTestId('movement-modal-cancel'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
