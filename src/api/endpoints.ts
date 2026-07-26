import { z } from 'zod';
import { apiRequest } from '@/api/client';
import {
  accountSchema,
  authResponseSchema,
  executionSchema,
  listSchema,
  orderEventSchema,
  orderSchema,
  positionSchema,
  quoteSchema,
  userSchema,
  type Account,
  type AuthResponse,
  type Execution,
  type Order,
  type OrderEvent,
  type OrderSide,
  type OrderStatus,
  type OrderType,
  type Position,
  type Quote,
  type TimeInForce,
  type User,
} from '@/api/schemas';
import type { SymbolCode } from '@/lib/symbols';

function unwrapList<T>(value: T[] | { items: T[] }): T[] {
  return Array.isArray(value) ? value : value.items;
}

export type Credentials = { email: string; password: string };

export type CreateOrderInput = {
  symbol: SymbolCode;
  side: OrderSide;
  quantity: number;
  order_type: OrderType;
  time_in_force: TimeInForce;
  limit_price?: string | null;
  stop_price?: string | null;
};

export type OrderFilters = {
  symbol?: SymbolCode;
  side?: OrderSide;
  status?: OrderStatus;
  limit?: number;
};

export async function login(credentials: Credentials): Promise<AuthResponse> {
  return apiRequest('/auth/login', authResponseSchema, { method: 'POST', body: credentials });
}

export async function register(credentials: Credentials): Promise<AuthResponse> {
  return apiRequest('/auth/register', authResponseSchema, { method: 'POST', body: credentials });
}

export async function me(): Promise<User> {
  return apiRequest('/auth/me', userSchema);
}

export async function getQuotes(symbols: readonly SymbolCode[]): Promise<Quote[]> {
  const params = new URLSearchParams({ symbols: symbols.join(',') });
  const data = await apiRequest(`/quotes?${params}`, listSchema(quoteSchema));
  return unwrapList(data);
}

export async function getQuote(symbol: SymbolCode): Promise<Quote> {
  return apiRequest(`/quotes/${symbol}`, quoteSchema);
}

export async function getAccount(): Promise<Account> {
  return apiRequest('/portfolio/account', accountSchema);
}

export async function getPositions(): Promise<Position[]> {
  const data = await apiRequest('/portfolio/positions?limit=100', listSchema(positionSchema));
  return unwrapList(data);
}

export async function getOrders(filters: OrderFilters = {}): Promise<Order[]> {
  const params = new URLSearchParams({ limit: String(filters.limit ?? 50) });
  if (filters.symbol) params.set('symbol', filters.symbol);
  if (filters.side) params.set('side', filters.side);
  if (filters.status) params.set('status', filters.status);
  const data = await apiRequest(`/orders?${params}`, listSchema(orderSchema));
  return unwrapList(data);
}

export async function getOrder(orderId: string): Promise<Order> {
  return apiRequest(`/orders/${orderId}`, orderSchema);
}

export async function getOrderEvents(orderId: string): Promise<OrderEvent[]> {
  const data = await apiRequest(
    `/orders/${orderId}/events?limit=100`,
    listSchema(orderEventSchema),
  );
  return unwrapList(data);
}

export async function createOrder(input: CreateOrderInput, idempotencyKey: string): Promise<Order> {
  return apiRequest('/orders', orderSchema, {
    method: 'POST',
    body: input,
    idempotencyKey,
    timeoutMs: 20_000,
  });
}

export async function cancelOrder(orderId: string, idempotencyKey: string): Promise<Order> {
  return apiRequest(`/orders/${orderId}/cancel`, orderSchema, {
    method: 'POST',
    idempotencyKey,
    timeoutMs: 20_000,
  });
}

export async function getExecutions(
  filters: { symbol?: SymbolCode; limit?: number } = {},
): Promise<Execution[]> {
  const params = new URLSearchParams({ limit: String(filters.limit ?? 50) });
  if (filters.symbol) params.set('symbol', filters.symbol);
  const data = await apiRequest(`/executions?${params}`, listSchema(executionSchema));
  return unwrapList(data);
}

export const nullSchema = z.null();
