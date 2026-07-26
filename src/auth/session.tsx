import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setUnauthorizedHandler } from '@/api/client';
import { useMe } from '@/api/queries';
import type { AuthResponse, User } from '@/api/schemas';
import { isJwtExpired } from '@/lib/jwt';
import { tokenStorage } from '@/lib/storage';

type SessionExpiredReason = 'expired' | 'unauthorized' | null;

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  sessionExpiredReason: SessionExpiredReason;
  acceptAuthResponse: (response: AuthResponse) => void;
  logout: (reason?: SessionExpiredReason) => void;
  clearNotice: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => {
    const stored = tokenStorage.get();
    if (stored && isJwtExpired(stored)) {
      tokenStorage.clear();
      return null;
    }
    return stored;
  });
  const [sessionExpiredReason, setSessionExpiredReason] = useState<SessionExpiredReason>(null);
  const meQuery = useMe(Boolean(token));

  const logout = useCallback(
    (reason: SessionExpiredReason = null) => {
      tokenStorage.clear();
      setToken(null);
      setSessionExpiredReason(reason);
      queryClient.clear();
    },
    [queryClient],
  );

  useEffect(() => {
    setUnauthorizedHandler(() => logout('unauthorized'));
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    if (!token) return undefined;
    const expiry = (() => {
      try {
        const [, payload] = token.split('.');
        if (!payload) return null;
        const parsed = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
          exp?: unknown;
        };
        return typeof parsed.exp === 'number' ? parsed.exp * 1000 : null;
      } catch {
        return null;
      }
    })();
    if (!expiry) return undefined;
    const timeout = window.setTimeout(() => logout('expired'), Math.max(0, expiry - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [logout, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user: meQuery.data ?? null,
      isAuthenticated: Boolean(token),
      isBootstrapping: Boolean(token) && meQuery.isLoading,
      sessionExpiredReason,
      acceptAuthResponse(response) {
        tokenStorage.set(response.access_token);
        setToken(response.access_token);
        setSessionExpiredReason(null);
        if (response.user) queryClient.setQueryData(['auth', 'me'], response.user);
      },
      logout,
      clearNotice() {
        setSessionExpiredReason(null);
      },
    }),
    [logout, meQuery.data, meQuery.isLoading, queryClient, sessionExpiredReason, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
