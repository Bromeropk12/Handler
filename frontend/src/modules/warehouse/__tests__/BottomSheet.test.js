import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import BottomSheet from '../components/bottom/BottomSheet';

describe('BottomSheet', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders header title and children', () => {
    const { getByText, getByTestId } = render(
      <BottomSheet view="empty" headerTitle="Información">
        <div data-testid="child">hola</div>
      </BottomSheet>
    );
    expect(getByText('Información')).toBeTruthy();
    expect(getByTestId('child')).toBeTruthy();
  });

  test('renders drag handle', () => {
    const { container } = render(
      <BottomSheet view="empty" headerTitle="t">x</BottomSheet>
    );
    const handle = container.querySelector('[data-testid="bottom-sheet-handle"]');
    expect(handle).toBeTruthy();
  });

  test('pointerup on handle (no drag) cycles state', () => {
    const { container } = render(
      <BottomSheet view="empty" headerTitle="t" persistKey="test1">x</BottomSheet>
    );
    const handle = container.querySelector('[data-testid="bottom-sheet-handle"]');
    const sheet = container.querySelector('[data-testid="bottom-sheet"]');
    const h0 = sheet.style.height;
    act(() => {
      fireEvent.pointerDown(handle, { clientY: 100, pointerId: 1 });
      fireEvent.pointerUp(handle, { clientY: 100, pointerId: 1 });
    });
    const h1 = sheet.style.height;
    expect(h0).not.toBe(h1);
  });

  test('renders Expandir button when collapsed and onClose provided', () => {
    const onClose = jest.fn();
    const { container, getByText } = render(
      <BottomSheet view="empty" headerTitle="t" onClose={onClose} forceState="collapsed">x</BottomSheet>
    );
    const btn = getByText(/Expandir/);
    expect(btn).toBeTruthy();
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('persists height in localStorage on cycle', () => {
    const { container } = render(
      <BottomSheet view="empty" headerTitle="t" persistKey="mykey">x</BottomSheet>
    );
    const handle = container.querySelector('[data-testid="bottom-sheet-handle"]');
    act(() => {
      fireEvent.pointerDown(handle, { clientY: 100, pointerId: 1 });
      fireEvent.pointerUp(handle, { clientY: 100, pointerId: 1 });
    });
    expect(localStorage.getItem('handler.bottomSheet.mykey')).toBeTruthy();
  });

  test('auto-expands when view=confirm', () => {
    const { container, rerender } = render(
      <BottomSheet view="empty" headerTitle="t" persistKey="autok">x</BottomSheet>
    );
    rerender(<BottomSheet view="confirm" headerTitle="t" persistKey="autok">x</BottomSheet>);
    const sheet = container.querySelector('[data-testid="bottom-sheet"]');
    const h = parseInt(sheet.style.height, 10);
    expect(h).toBeGreaterThan(40);
  });

  test('auto-expands when view=movement', () => {
    const { container, rerender } = render(
      <BottomSheet view="empty" headerTitle="t" persistKey="autok2">x</BottomSheet>
    );
    rerender(<BottomSheet view="movement" headerTitle="t" persistKey="autok2">x</BottomSheet>);
    const sheet = container.querySelector('[data-testid="bottom-sheet"]');
    const h = parseInt(sheet.style.height, 10);
    expect(h).toBeGreaterThan(40);
  });

  test('double-click on handle cycles to default', () => {
    const { container } = render(
      <BottomSheet view="empty" headerTitle="t" persistKey="resetk">x</BottomSheet>
    );
    const handle = container.querySelector('[data-testid="bottom-sheet-handle"]');
    act(() => {
      fireEvent.pointerDown(handle, { clientY: 100, pointerId: 1 });
      fireEvent.pointerUp(handle, { clientY: 100, pointerId: 1 });
    });
    act(() => {
      fireEvent.pointerDown(handle, { clientY: 100, pointerId: 2 });
      fireEvent.pointerUp(handle, { clientY: 100, pointerId: 2 });
    });
    act(() => { fireEvent.doubleClick(handle); });
    const sheet = container.querySelector('[data-testid="bottom-sheet"]');
    expect(sheet.style.height).toBeTruthy();
  });
});
