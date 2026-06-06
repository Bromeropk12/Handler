import { formatSampleId, SAMPLE_ID_REGEX } from '../utils/formatSampleId';

describe('formatSampleId', () => {
  test('zero-pads single digit', () => {
    expect(formatSampleId(1)).toBe('S-0001');
  });
  test('zero-pads three digits', () => {
    expect(formatSampleId(123)).toBe('S-0123');
  });
  test('keeps 4 digits as is', () => {
    expect(formatSampleId(1234)).toBe('S-1234');
  });
  test('does not truncate larger ids', () => {
    expect(formatSampleId(99999)).toBe('S-99999');
    expect(formatSampleId(100000)).toBe('S-100000');
  });
  test('accepts string input', () => {
    expect(formatSampleId('42')).toBe('S-0042');
  });
  test('handles null and NaN gracefully', () => {
    expect(formatSampleId(null)).toBe('S-????');
    expect(formatSampleId(undefined)).toBe('S-????');
    expect(formatSampleId('abc')).toBe('S-????');
  });
  test('always matches the regex', () => {
    [1, 10, 100, 1000, 9999, 10000, 99999].forEach((id) => {
      expect(formatSampleId(id)).toMatch(SAMPLE_ID_REGEX);
    });
  });
});
