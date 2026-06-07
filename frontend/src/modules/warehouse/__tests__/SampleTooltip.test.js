import { render, screen, fireEvent } from '@testing-library/react';
import SampleTooltip from '../components/3d/SampleTooltip';

const baseSample = {
  id: 1,
  name: 'Acetona',
  global_sample_name: 'Acetona HPLC',
  lot: 'L-2024-01',
  weight_grams: 250,
  ghs_danger_class: 'Tóxico',
};

describe('SampleTooltip', () => {
  test('renders sample id formatted and name', () => {
    render(<SampleTooltip sample={baseSample} sgaColor="#f87171" />);
    const tooltip = screen.getByTestId('sample-tooltip');
    expect(tooltip).toBeTruthy();
    expect(tooltip.textContent).toContain('S-0001');
    expect(tooltip.textContent).toContain('Acetona');
  });

  test('renders lot and weight in data mini-grid', () => {
    render(<SampleTooltip sample={baseSample} />);
    const tooltip = screen.getByTestId('sample-tooltip');
    expect(tooltip.textContent).toContain('L-2024-01');
    expect(tooltip.textContent).toContain('250g');
  });

  test('calls onViewDetail when Ver detalle clicked', () => {
    const onViewDetail = jest.fn();
    render(<SampleTooltip sample={baseSample} onViewDetail={onViewDetail} />);
    fireEvent.click(screen.getByTestId('sample-tooltip-detail'));
    expect(onViewDetail).toHaveBeenCalledTimes(1);
  });

  test('calls onMove when Mover clicked', () => {
    const onMove = jest.fn();
    render(<SampleTooltip sample={baseSample} onMove={onMove} />);
    fireEvent.click(screen.getByTestId('sample-tooltip-move'));
    expect(onMove).toHaveBeenCalledTimes(1);
  });

  test('calls onAddToGroup when + Grupo clicked', () => {
    const onAddToGroup = jest.fn();
    render(<SampleTooltip sample={baseSample} onAddToGroup={onAddToGroup} />);
    fireEvent.click(screen.getByTestId('sample-tooltip-add-group'));
    expect(onAddToGroup).toHaveBeenCalledTimes(1);
  });

  test('does not render + Grupo button when onAddToGroup is missing', () => {
    render(<SampleTooltip sample={baseSample} />);
    expect(screen.queryByTestId('sample-tooltip-add-group')).toBeNull();
  });

  test('returns null when sample is missing', () => {
    const { container } = render(<SampleTooltip sample={null} />);
    expect(container.firstChild).toBeNull();
  });
});
