import { formatElapsed, chunkArray, CATEGORY_LABEL, DIFFICULTY_COLOR } from '../utils';

describe('formatElapsed', () => {
  it('formats seconds under a minute', () => {
    expect(formatElapsed(5)).toBe('0:05');
    expect(formatElapsed(59)).toBe('0:59');
  });
  it('formats minutes correctly', () => {
    expect(formatElapsed(60)).toBe('1:00');
    expect(formatElapsed(125)).toBe('2:05');
  });
  it('pads single-digit seconds', () => {
    expect(formatElapsed(61)).toBe('1:01');
  });
});

describe('chunkArray', () => {
  it('chunks evenly', () => {
    expect(chunkArray([1,2,3,4,5,6], 3)).toEqual([[1,2,3],[4,5,6]]);
  });
  it('handles remainder', () => {
    expect(chunkArray([1,2,3,4,5], 3)).toEqual([[1,2,3],[4,5]]);
  });
  it('handles empty array', () => {
    expect(chunkArray([], 3)).toEqual([]);
  });
  it('chunk size larger than array', () => {
    expect(chunkArray([1,2], 3)).toEqual([[1,2]]);
  });
});

describe('CATEGORY_LABEL', () => {
  it('has an entry for every category', () => {
    const cats = ['handicap','appliance','speedrun','wildcard','dare'] as const;
    cats.forEach(c => expect(CATEGORY_LABEL[c]).toBeTruthy());
  });
});

describe('DIFFICULTY_COLOR', () => {
  it('has entries for all four difficulties', () => {
    const diffs = ['easy','medium','hard','insane'] as const;
    diffs.forEach(d => {
      expect(DIFFICULTY_COLOR[d].bg).toBeTruthy();
      expect(DIFFICULTY_COLOR[d].label).toBeTruthy();
    });
  });
});
