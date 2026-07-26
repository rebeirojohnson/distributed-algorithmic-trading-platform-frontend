export function getJwtExpiryMs(token: string): number | null {
  const [, payload] = token.split('.');
  if (!payload) return null;
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized)) as { exp?: unknown };
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string, skewMs = 30_000): boolean {
  const expiry = getJwtExpiryMs(token);
  return expiry !== null && Date.now() + skewMs >= expiry;
}
