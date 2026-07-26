import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const futureToken = createToken(Math.floor(Date.now() / 1000) + 3600);

export const fixtures = {
  token: futureToken,
  user: { id: 'user-1', email: 'trader@example.com' },
  quote: {
    symbol: 'AAPL',
    bid: '189.1200',
    ask: '189.1400',
    last: '189.1300',
    bid_size: 100,
    ask_size: 200,
    as_of: new Date().toISOString(),
  },
  account: {
    id: 'acct-1',
    cash_total: '100000.00',
    cash_available: '98500.00',
    cash_reserved: '1500.00',
    as_of: new Date().toISOString(),
  },
  order: {
    id: 'ord-1',
    symbol: 'AAPL',
    side: 'BUY',
    order_type: 'MARKET',
    quantity: 1,
    time_in_force: 'DAY',
    status: 'PENDING_VALIDATION',
    limit_price: null,
    stop_price: null,
    filled_quantity: 0,
    average_fill_price: null,
    created_at: new Date().toISOString(),
    expires_at: null,
  },
};

export const server = setupServer(
  http.post('*/api/v1/auth/login', () =>
    HttpResponse.json({ access_token: fixtures.token, user: fixtures.user }),
  ),
  http.post('*/api/v1/auth/register', () =>
    HttpResponse.json({ access_token: fixtures.token, user: fixtures.user }),
  ),
  http.get('*/api/v1/auth/me', () => HttpResponse.json(fixtures.user)),
  http.get('*/api/v1/quotes', () => HttpResponse.json([fixtures.quote])),
  http.get('*/api/v1/quotes/:symbol', ({ params }) =>
    HttpResponse.json({ ...fixtures.quote, symbol: params.symbol }),
  ),
  http.get('*/api/v1/portfolio/account', () => HttpResponse.json(fixtures.account)),
  http.get('*/api/v1/portfolio/positions', () =>
    HttpResponse.json([
      {
        symbol: 'AAPL',
        quantity: 10,
        available_quantity: 10,
        reserved_quantity: 0,
        average_price: '180.00',
        market_price: '189.1300',
        market_value: '1891.30',
        realized_pnl: '0.00',
        unrealized_pnl: '91.30',
        as_of: new Date().toISOString(),
      },
    ]),
  ),
  http.get('*/api/v1/orders', () => HttpResponse.json([fixtures.order])),
  http.get('*/api/v1/orders/:orderId', () => HttpResponse.json(fixtures.order)),
  http.get('*/api/v1/orders/:orderId/events', () =>
    HttpResponse.json([
      {
        id: 'evt-1',
        order_id: 'ord-1',
        status: 'PENDING_VALIDATION',
        message: 'Accepted',
        created_at: new Date().toISOString(),
      },
    ]),
  ),
  http.post('*/api/v1/orders', () => HttpResponse.json(fixtures.order, { status: 202 })),
  http.post('*/api/v1/orders/:orderId/cancel', () =>
    HttpResponse.json({ ...fixtures.order, status: 'CANCEL_PENDING' }, { status: 202 }),
  ),
  http.get('*/api/v1/executions', () =>
    HttpResponse.json([
      {
        id: 'exec-1',
        order_id: 'ord-1',
        symbol: 'AAPL',
        side: 'BUY',
        quantity: 1,
        price: '189.1300',
        executed_at: new Date().toISOString(),
      },
    ]),
  ),
);

function createToken(exp: number): string {
  const payload = btoa(JSON.stringify({ exp }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `header.${payload}.signature`;
}
