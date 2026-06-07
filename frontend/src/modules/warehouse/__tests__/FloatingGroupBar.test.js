import { render, screen, fireEvent } from '@testing-library/react';
import FloatingGroupBar from '../components/ui/FloatingGroupBar';

describe('FloatingGroupBar', () => {
  test('renders nothing when count < 2', () => {
    const { container } = render(<FloatingGroupBar count={1} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders count, name and SGA badge', () => {
    render(
      <FloatingGroupBar
        count={3}
        selectionType={{ name: 'Acetona', dangerClass: 'Tóxico' }}
      />
    );
    const bar = screen.getByTestId('floating-group-bar');
    expect(bar).toBeTruthy();
    expect(bar.textContent).toContain('3');
    expect(bar.textContent).toContain('Acetona');
    expect(bar.textContent).toContain('TÓXICO');
  });

  test('shows stale indicator when isStale is true', () => {
    render(
      <FloatingGroupBar
        count={3}
        selectionType={{ name: 'X' }}
        isStale
      />
    );
    expect(screen.getByTestId('stale-indicator')).toBeTruthy();
  });

  test('calls onClear and onMoveGroup when buttons clicked', () => {
    const onClear = jest.fn();
    const onMoveGroup = jest.fn();
    render(
      <FloatingGroupBar
        count={2}
        selectionType={{ name: 'X' }}
        onClear={onClear}
        onMoveGroup={onMoveGroup}
      />
    );
    fireEvent.click(screen.getByTestId('floating-group-clear'));
    fireEvent.click(screen.getByTestId('floating-group-move'));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onMoveGroup).toHaveBeenCalledTimes(1);
  });
});
