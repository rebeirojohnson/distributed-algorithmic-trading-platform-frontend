import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/queries';
import { orderSchema, quoteSchema, type Quote } from '@/api/schemas';
import { runtimeConfig } from '@/api/config';
import { useAuth } from '@/auth/session';
import { SUPPORTED_SYMBOLS, type SymbolCode } from '@/lib/symbols';

type RealtimeState =
  | 'idle'
  | 'connecting'
  | 'authenticating'
  | 'connected'
  | 'reconnecting'
  | 'unauthorized'
  | 'offline';
type SparkPoint = { value: string; at: number };

type RealtimeContextValue = {
  state: RealtimeState;
  sparklines: Partial<Record<SymbolCode, SparkPoint[]>>;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);
const MAX_SPARK_POINTS = 80;
const MAX_EVENT_IDS = 500;

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated, logout } = useAuth();
  const queryClient = useQueryClient();
  const [state, setState] = useState<RealtimeState>('idle');
  const [sparklines, setSparklines] = useState<Partial<Record<SymbolCode, SparkPoint[]>>>({});
  const eventIds = useRef<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setState('idle');
      return undefined;
    }

    let socket: WebSocket | null = null;
    let heartbeat: number | null = null;
    let reconnect: number | null = null;
    let attempt = 0;
    let closed = false;

    const connect = () => {
      setState(attempt === 0 ? 'connecting' : 'reconnecting');
      const url = runtimeConfig.wsUrl.startsWith('ws')
        ? runtimeConfig.wsUrl
        : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${runtimeConfig.wsUrl}`;
      socket = new WebSocket(url);

      const authTimeout = window.setTimeout(() => {
        if (socket?.readyState === WebSocket.OPEN) socket.close();
      }, 10_000);

      socket.addEventListener('open', () => {
        setState('authenticating');
        socket?.send(JSON.stringify({ type: 'authenticate', token }));
      });

      socket.addEventListener('message', (event: MessageEvent<string>) => {
        const message = parseMessage(event.data);
        if (!message) return;
        if (message.type === 'authenticated') {
          window.clearTimeout(authTimeout);
          attempt = 0;
          setState('connected');
          refetchSnapshots(queryClient);
          subscribe(socket, [
            'orders',
            'executions',
            'portfolio',
            ...SUPPORTED_SYMBOLS.map((symbol) => `quotes:${symbol}`),
          ]);
          heartbeat = window.setInterval(
            () => socket?.send(JSON.stringify({ type: 'ping' })),
            30_000,
          );
          return;
        }
        if (message.type === 'unauthorized') {
          setState('unauthorized');
          logout('unauthorized');
          socket?.close();
          return;
        }
        if (message.type === 'pong') return;
        if (dedupe(message.event_id, eventIds.current)) return;
        reconcileMessage(message, queryClient, setSparklines);
      });

      socket.addEventListener('close', () => {
        window.clearTimeout(authTimeout);
        if (heartbeat) window.clearInterval(heartbeat);
        if (closed) return;
        setState(navigator.onLine ? 'reconnecting' : 'offline');
        const delay = Math.min(20_000, 1_000 * 2 ** attempt) + Math.floor(Math.random() * 500);
        attempt += 1;
        reconnect = window.setTimeout(connect, delay);
      });
    };

    connect();

    return () => {
      closed = true;
      if (heartbeat) window.clearInterval(heartbeat);
      if (reconnect) window.clearTimeout(reconnect);
      socket?.close();
    };
  }, [isAuthenticated, logout, queryClient, token]);

  const value = useMemo(() => ({ state, sparklines }), [sparklines, state]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime(): RealtimeContextValue {
  const value = useContext(RealtimeContext);
  if (!value) throw new Error('useRealtime must be used within RealtimeProvider');
  return value;
}

function subscribe(socket: WebSocket | null, channels: string[]): void {
  channels
    .slice(0, 20)
    .forEach((channel) => socket?.send(JSON.stringify({ type: 'subscribe', channel })));
}

function parseMessage(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return typeof parsed.type === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

function dedupe(eventId: unknown, ids: string[]): boolean {
  if (typeof eventId !== 'string') return false;
  if (ids.includes(eventId)) return true;
  ids.push(eventId);
  if (ids.length > MAX_EVENT_IDS) ids.shift();
  return false;
}

function reconcileMessage(
  message: Record<string, unknown>,
  queryClient: ReturnType<typeof useQueryClient>,
  setSparklines: React.Dispatch<React.SetStateAction<Partial<Record<SymbolCode, SparkPoint[]>>>>,
): void {
  const data = message.data ?? message.payload;
  if (message.type === 'quote') {
    const parsed = quoteSchema.safeParse(data);
    if (!parsed.success) return;
    queryClient.setQueryData(queryKeys.quote(parsed.data.symbol), parsed.data);
    queryClient.setQueryData(queryKeys.quotes(SUPPORTED_SYMBOLS), (quotes: Quote[] | undefined) => {
      if (!quotes) return quotes;
      return quotes.map((quote) => (quote.symbol === parsed.data.symbol ? parsed.data : quote));
    });
    if (parsed.data.last) {
      setSparklines((current) => {
        const next = [
          ...(current[parsed.data.symbol] ?? []),
          { value: parsed.data.last!, at: Date.now() },
        ].slice(-MAX_SPARK_POINTS);
        return { ...current, [parsed.data.symbol]: next };
      });
    }
    return;
  }
  if (message.type === 'order') {
    const parsed = orderSchema.safeParse(data);
    if (parsed.success) queryClient.setQueryData(queryKeys.order(parsed.data.id), parsed.data);
    void queryClient.invalidateQueries({ queryKey: ['orders'] });
    return;
  }
  if (message.type === 'execution') {
    void queryClient.invalidateQueries({ queryKey: ['executions'] });
    void queryClient.invalidateQueries({ queryKey: ['orders'] });
    void queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    return;
  }
  if (message.type === 'portfolio') void queryClient.invalidateQueries({ queryKey: ['portfolio'] });
}

function refetchSnapshots(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: ['orders'] });
  void queryClient.invalidateQueries({ queryKey: ['executions'] });
  void queryClient.invalidateQueries({ queryKey: ['portfolio'] });
  void queryClient.invalidateQueries({ queryKey: ['quotes'] });
}
