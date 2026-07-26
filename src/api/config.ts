function normalizePath(value: string): string {
  return value.replace(/\/$/, '');
}

function resolveApiBaseUrl(value: string): string {
  const normalized = normalizePath(value);
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return `${globalThis.location?.origin ?? 'http://localhost'}${normalized.startsWith('/') ? normalized : `/${normalized}`}`;
}

type RuntimeConfig = {
  apiBaseUrl: string;
  wsUrl: string;
};

type ViteRuntimeEnv = {
  VITE_API_BASE_URL?: string;
  VITE_WS_URL?: string;
};

const viteEnv = import.meta.env as unknown as ViteRuntimeEnv;
const apiBaseUrl = viteEnv.VITE_API_BASE_URL || '/api/v1';
const wsUrl = viteEnv.VITE_WS_URL || '/ws/v1/ws';

export const runtimeConfig: RuntimeConfig = {
  apiBaseUrl: resolveApiBaseUrl(apiBaseUrl),
  wsUrl,
};
