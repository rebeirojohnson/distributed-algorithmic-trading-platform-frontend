import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/endpoints';
import type { Order } from '@/api/schemas';
import { SUPPORTED_SYMBOLS, type SymbolCode } from '@/lib/symbols';

export const queryKeys = {
  me: ['auth', 'me'] as const,
  quotes: (symbols: readonly SymbolCode[]) => ['quotes', symbols.join(',')] as const,
  quote: (symbol: SymbolCode) => ['quote', symbol] as const,
  account: ['portfolio', 'account'] as const,
  positions: ['portfolio', 'positions'] as const,
  orders: (filters?: api.OrderFilters) => ['orders', filters ?? {}] as const,
  order: (orderId: string) => ['orders', 'detail', orderId] as const,
  orderEvents: (orderId: string) => ['orders', 'events', orderId] as const,
  executions: (symbol?: SymbolCode) => ['executions', symbol ?? 'all'] as const,
};

export function useMe(enabled: boolean) {
  return useQuery({ queryKey: queryKeys.me, queryFn: api.me, enabled, retry: false });
}

export function useQuotes(symbols: readonly SymbolCode[] = SUPPORTED_SYMBOLS) {
  return useQuery({
    queryKey: queryKeys.quotes(symbols),
    queryFn: () => api.getQuotes(symbols),
    staleTime: 5_000,
  });
}

export function useQuote(symbol: SymbolCode) {
  return useQuery({
    queryKey: queryKeys.quote(symbol),
    queryFn: () => api.getQuote(symbol),
    staleTime: 5_000,
  });
}

export function useAccount() {
  return useQuery({ queryKey: queryKeys.account, queryFn: api.getAccount });
}

export function usePositions() {
  return useQuery({ queryKey: queryKeys.positions, queryFn: api.getPositions });
}

export function useOrders(filters?: api.OrderFilters) {
  return useQuery({
    queryKey: queryKeys.orders(filters),
    queryFn: () => api.getOrders(filters),
    placeholderData: (data) => data,
  });
}

export function useOrder(orderId: string) {
  return useQuery({ queryKey: queryKeys.order(orderId), queryFn: () => api.getOrder(orderId) });
}

export function useOrderEvents(orderId: string) {
  return useQuery({
    queryKey: queryKeys.orderEvents(orderId),
    queryFn: () => api.getOrderEvents(orderId),
  });
}

export function useExecutions(symbol?: SymbolCode) {
  return useQuery({
    queryKey: queryKeys.executions(symbol),
    queryFn: () => api.getExecutions({ symbol }),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      idempotencyKey,
    }: {
      input: api.CreateOrderInput;
      idempotencyKey: string;
    }) => api.createOrder(input, idempotencyKey),
    onSuccess: (order: Order) => {
      queryClient.setQueryData(queryKeys.order(order.id), order);
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.account });
    },
  });
}

export function useCancelOrder(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idempotencyKey: string) => api.cancelOrder(orderId, idempotencyKey),
    onSuccess: (order: Order) => {
      queryClient.setQueryData(queryKeys.order(order.id), order);
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
