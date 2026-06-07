import { render, screen } from '@testing-library/react';
import GroupChip from '../components/3d/GroupChip';

describe('GroupChip', () => {
  test('renders sample id formatted as S-XXXX', () => {
    render(<GroupChip sample={{ id: 42 }} sgaColor="#ff0000" />);
    const el = screen.getByTestId('group-chip-42');
    expect(el).toBeTruthy();
    expect(el.textContent).toContain('S-0042');
  });

  test('renders null when sample is missing', () => {
    const { container } = render(<GroupChip sample={null} />);
    expect(container.firstChild).toBeNull();
  });
});
