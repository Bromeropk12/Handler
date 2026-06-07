import { render, screen, fireEvent, act } from '@testing-library/react';
import ToastReject from '../components/ui/ToastReject';

describe('ToastReject', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders nothing when rejection is null', () => {
    const { container } = render(<ToastReject rejection={null} />);
    expect(container.firstChild).toBeNull();
  });

  test('auto-dismisses after 3s by default', () => {
    const onDismiss = jest.fn();
    render(
      <ToastReject
        rejection={{ type: 'type' }}
        onDismiss={onDismiss}
      />
    );
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => { jest.advanceTimersByTime(3000); });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('calls onReplace when button clicked (type rejection)', () => {
    const onReplace = jest.fn();
    render(
      <ToastReject
        rejection={{ type: 'type' }}
        onReplace={onReplace}
        onDismiss={() => {}}
      />
    );
    fireEvent.click(screen.getByTestId('toast-reject-replace'));
    expect(onReplace).toHaveBeenCalledTimes(1);
  });

  test('shows correct reject type attribute for dimension rejection', () => {
    render(<ToastReject rejection={{ type: 'dimension' }} />);
    const toast = screen.getByTestId('toast-reject');
    expect(toast.getAttribute('data-reject-type')).toBe('dimension');
  });
});
