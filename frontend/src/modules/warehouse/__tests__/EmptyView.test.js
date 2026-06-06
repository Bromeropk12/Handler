import React from 'react';
import { render } from '@testing-library/react';
import EmptyView from '../components/bottom/EmptyView';

describe('EmptyView', () => {
  test('renders default hint', () => {
    const { getByTestId } = render(<EmptyView hasActiveSelection={false} />);
    const el = getByTestId('empty-view');
    expect(el).toBeTruthy();
    expect(el.textContent).toContain('Click en un cubo');
  });

  test('opacity drops when there is an active selection', () => {
    const { rerender, getByTestId } = render(<EmptyView hasActiveSelection={false} />);
    const noSel = getByTestId('empty-view').style.opacity;
    rerender(<EmptyView hasActiveSelection={true} />);
    const withSel = getByTestId('empty-view').style.opacity;
    expect(parseFloat(withSel)).toBeLessThan(parseFloat(noSel));
  });
});
