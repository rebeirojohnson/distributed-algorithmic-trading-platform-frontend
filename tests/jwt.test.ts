import { describe, expect, it } from 'vitest';
import { getJwtExpiryMs, isJwtExpired } from '@/lib/jwt';

function token(exp: number) {
  const payload = btoa(JSON.stringify({ exp }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `x.${payload}.y`;
}

describe('jwt helpers', () => {
  it('reads expiry in milliseconds', () => {
    expect(getJwtExpiryMs(token(10))).toBe(10_000);
  });

  it('detects expired tokens with skew', () => {
    expect(isJwtExpired(token(1))).toBe(true);
  });
});
