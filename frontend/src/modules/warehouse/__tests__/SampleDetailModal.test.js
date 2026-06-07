import { render, screen, fireEvent } from '@testing-library/react';
import SampleDetailModal from '../components/ui/SampleDetailModal';

const fullSample = {
  id: 42,
  name: 'Metanol',
  lot: 'L-99',
  weight_grams: 500,
  ghs_danger_class: 'Inflamable',
  status: 'occupied',
  width: 2, height: 2, depth: 2,
  expiration_date: '2026-12-31',
  position_x: 0, position_y: 1, position_z: 0,
  shelf_name: 'Anaquel A-1',
};

describe('SampleDetailModal', () => {
  test('renders null when sample is missing', () => {
    const { container } = render(<SampleDetailModal sample={null} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders full data grid (lot, weight, SGA, status, dims, expiration, position, shelf)', () => {
    render(<SampleDetailModal sample={fullSample} onClose={() => {}} />);
    const modal = screen.getByTestId('sample-detail-modal');
    expect(modal).toBeTruthy();
    expect(modal.textContent).toContain('L-99');
    expect(modal.textContent).toContain('500 g');
    expect(modal.textContent).toContain('Inflamable');
    expect(modal.textContent).toContain('Activa');
    expect(modal.textContent).toContain('2×2×2');
    expect(modal.textContent).toContain('Anaquel A-1');
  });

  test('calls onMoveSingle when Mover individual clicked', () => {
    const onMoveSingle = jest.fn();
    render(<SampleDetailModal sample={fullSample} onClose={() => {}} onMoveSingle={onMoveSingle} />);
    fireEvent.click(screen.getByTestId('sample-detail-modal-move'));
    expect(onMoveSingle).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when close button clicked', () => {
    const onClose = jest.fn();
    render(<SampleDetailModal sample={fullSample} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('sample-detail-modal-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
