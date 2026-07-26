import type { ZodType } from 'zod';
import { runtimeConfig } from '@/api/config';
import { tokenStorage } from '@/lib/storage';

export type ApiErrorKind =
  'network' | 'timeout' | 'unauthorized' | 'conflict' | 'validation' | 'server';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly details?: unknown;

  constructor(kind: ApiErrorKind, message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.details = details;
  }
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  idempotencyKey?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
};

async function readError(response: Response): Promise<ApiError> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  const fallback = response.statusText || 'Request failed';
  const message = extractErrorMessage(payload) || fallback;
  if (response.status === 401)
    return new ApiError('unauthorized', message, response.status, payload);
  if (response.status === 409) return new ApiError('conflict', message, response.status, payload);
  if (response.status === 422 || response.status === 400) {
    return new ApiError('validation', message, response.status, payload);
  }
  return new ApiError('server', message, response.status, payload);
}

function extractErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const detail = record.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0)
    return 'The request did not pass backend validation.';
  if (typeof record.message === 'string') return record.message;
  if (typeof record.error === 'string') return record.error;
  return null;
}

export async function apiRequest<T>(
  path: string,
  schema: ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs ?? 15_000);
  const forwardAbort = () => controller.abort();
  options.signal?.addEventListener('abort', forwardAbort, { once: true });

  const headers = new Headers({ Accept: 'application/json' });
  const token = tokenStorage.get();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (options.idempotencyKey) headers.set('Idempotency-Key', options.idempotencyKey);

  try {
    const response = await fetch(`${runtimeConfig.apiBaseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await readError(response);
      if (error.kind === 'unauthorized') unauthorizedHandler?.();
      throw error;
    }

    if (response.status === 204) return schema.parse(null);
    const payload = (await response.json()) as unknown;
    return schema.parse(payload);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('timeout', 'Request timed out.');
    }
    throw new ApiError('network', 'Unable to reach the trading backend.', undefined, error);
  } finally {
    window.clearTimeout(timeout);
    options.signal?.removeEventListener('abort', forwardAbort);
  }
}
