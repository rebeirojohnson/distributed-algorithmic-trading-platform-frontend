const SESSION_TOKEN_KEY = 'paper-trading:access-token';

export const tokenStorage = {
  get(): string | null {
    return sessionStorage.getItem(SESSION_TOKEN_KEY);
  },
  set(token: string): void {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  },
  clear(): void {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  },
};
