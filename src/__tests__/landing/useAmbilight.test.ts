import { renderHook } from '@testing-library/react';
import { useAmbilight } from '@/components/landing/useAmbilight';

describe('useAmbilight', () => {
  it('returns fallback color when no image is provided', () => {
    const { result } = renderHook(() => useAmbilight(null, true));
    expect(result.current).toBe('rgba(10,5,3,1)');
  });

  it('returns fallback color when disabled', () => {
    const { result } = renderHook(() => useAmbilight('http://example.com/img.jpg', false));
    expect(result.current).toBe('rgba(10,5,3,1)');
  });
});
