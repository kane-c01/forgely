import { describe, expect, it } from 'vitest';

import { generateToken, hashToken, safeEqual } from '../../src/auth/tokens.js';

describe('auth/tokens', () => {
  it('generateToken returns a base64url string of the expected length', () => {
    const token = generateToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    // 32 bytes -> base64url with no padding -> 43 chars
    expect(token.length).toBeGreaterThanOrEqual(40);
  });

  it('two tokens are extremely unlikely to collide', () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toEqual(b);
  });

  it('hashToken is deterministic + 64 hex chars', () => {
    const a = hashToken('hello');
    const b = hashToken('hello');
    expect(a).toEqual(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('hashToken is sensitive to single-char changes', () => {
    expect(hashToken('hello')).not.toEqual(hashToken('hellp'));
  });

  it('safeEqual handles equal + unequal + different-length cases', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});
