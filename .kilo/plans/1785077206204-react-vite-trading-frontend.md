# React/Vite Trading Frontend Implementation Plan

## Goal

Build a separate-repository, production-ready React dashboard for the paper-trading backend. The frontend must support registration/login, deterministic live quotes, advanced order entry, asynchronous order tracking, executions, portfolio/P&L views, and authenticated realtime updates on desktop and mobile.

## Confirmed Decisions

- React 19, Vite, strict TypeScript, and a client-rendered SPA; SSR is out of scope.
- Tailwind CSS with a professional dark-terminal visual language.
- TanStack Router, Query, and Table; React Hook Form plus Zod for forms/contracts.
- Vitest, React Testing Library, MSW, and Playwright for validation.
- JWT access token in `sessionStorage`; no refresh token exists, so HTTP 401 or token expiry clears the session and redirects to login.
- Live session-only quote sparklines built from WebSocket updates; no historical chart claims or persistence.
- Production image serves static assets with Nginx and reverse-proxies `/api/` and `/ws` to the backend.

## Backend Contract And Caveats

- Default backend origin: `http://localhost:8000`; REST prefix `/v1`; WebSocket `/v1/ws`.
- Financial values arrive as decimal strings. Keep them as strings at API boundaries and use `decimal.js`; never use binary floating point for cash, price, P&L, or order calculations.
- Order creation body uses `order_type`, not the README's stale `type` example.
- WebSocket subscribe/unsubscribe messages accept one `channel` per message, not the README's stale `channels` array example.
- Supported symbols: AAPL, MSFT, GOOGL, AMZN, META, NVDA, TSLA, JPM, V, JNJ, WMT, PG, XOM, KO, DIS.
- Order enums: side `BUY|SELL`; type `MARKET|LIMIT|STOP|STOP_LIMIT`; time in force `DAY|GTC`.
- Order states: `PENDING_VALIDATION`, `ACCEPTED`, `ACTIVE`, `PARTIALLY_FILLED`, `FILLED`, `REJECTED`, `CANCEL_PENDING`, `CANCELLED`, `EXPIRED`, `FAILED`.
- Create and cancel commands require a unique `Idempotency-Key` and return `202`; UI completion must come from WebSocket events and snapshot refetching.
- Current list endpoints use bounded `limit` and filters but do not yet expose reliable cursor metadata. Implement bounded lists and avoid pretending infinite pagination is available.
- Portfolio market-value/unrealized fields may be null and quotes may be stale. Render explicit unavailable/stale states.
- There is no refresh token, password reset, email verification, user preferences API, historical candles, strategy runner, deposits, or withdrawals; exclude these from navigation and UI.

## Repository Scaffold

1. Create a Vite React TypeScript project with `src/`, `public/`, `tests/`, `e2e/`, `Dockerfile`, `nginx.conf`, `.env.example`, and CI.
2. Configure strict TypeScript, ESLint, Prettier, Tailwind, import aliases, Vitest/jsdom, Playwright, and production source maps according to environment policy.
3. Use feature-oriented folders:
   - `app/`: providers, router, layouts, global error boundary, query client.
   - `api/`: typed fetch client, Zod response parsing, errors, endpoint functions.
   - `auth/`: session store, route guards, login/register forms.
   - `market/`: watchlist, quote models, symbol workspace, session sparkline buffer.
   - `orders/`: ticket, validation, order tables/details/timeline, cancel workflow.
   - `portfolio/`: account summary, positions, allocation and P&L presentation.
   - `executions/`: fills table and detail drawer.
   - `realtime/`: WebSocket state machine, subscriptions, deduplication, cache reconciliation.
   - `components/`: accessible primitives and domain-neutral UI.
   - `lib/`: decimal, date, ID, storage, formatting, and test helpers.

## Application Architecture

1. Define a single runtime configuration layer:
   - Development defaults to Vite proxies for `/api -> http://localhost:8000` and `/ws -> ws://localhost:8000`.
   - Production uses same-origin Nginx proxies.
   - Support explicit `VITE_API_BASE_URL` and `VITE_WS_URL` only when intentionally deploying cross-origin.
2. Build a typed fetch client that:
   - Adds `Authorization: Bearer <token>` when authenticated.
   - Adds caller-provided idempotency keys to commands.
   - Parses JSON through Zod and normalizes backend FastAPI/platform error shapes into one UI error model.
   - Applies request timeout/abort support, but never blindly retries non-idempotent commands.
   - On 401, atomically clears token/query state, closes WebSocket, and redirects to `/login` with a session-expired notice.
3. Configure TanStack Query keys by account and resource. Use REST as authoritative state; WebSocket events invalidate or patch caches, followed by background refetches for order/execution/portfolio changes.
4. Keep authentication state minimal: token, decoded expiry for proactive logout, and `/v1/auth/me` result. Do not treat decoded JWT claims as account authorization data.

## Routes And Screens

1. Public routes:
   - `/login`: email/password, validation, invalid-credential feedback, redirect to intended route.
   - `/register`: email/password/confirmation, 12-character minimum, duplicate-email handling, automatic authenticated entry after success.
2. Authenticated application shell:
   - Left navigation on desktop and compact bottom/drawer navigation on mobile.
   - Persistent connection indicator, environment/paper-trading badge, account cash summary, and logout.
   - Routes: `/dashboard`, `/markets/:symbol`, `/orders`, `/orders/:orderId`, `/executions`, `/portfolio`.
3. Dashboard:
   - Cash total/available/reserved cards and quote-staleness state.
   - Fifteen-symbol watchlist with bid, ask, last, spread, side sizes, update pulse, and session trend.
   - Open/recent orders, recent executions, positions summary, and compact order ticket.
4. Symbol workspace:
   - Symbol metadata and live bid/ask/last header.
   - Bounded in-memory sparkline from current-session last prices, with “session data” labeling.
   - Bid/ask size display, order ticket preselected to symbol, and account's related orders/executions.
5. Orders:
   - Filterable/sortable table for symbol/status/side with status chips, fill progress, average price, and expiry.
   - Detail route with immutable event timeline from `/v1/orders/{id}/events` and related executions.
   - Cancel action only for cancellable states; confirmation dialog; disable while request is pending; treat repeated command safely.
6. Executions:
   - Bounded table of immutable fills with symbol, side, quantity, price, time, and order link.
7. Portfolio:
   - Cash breakdown, positions table, realized/unrealized P&L, market value when available, available versus reserved shares, `as_of`, and staleness warnings.
   - Do not fabricate totals from null market prices; show partial/unavailable valuation explicitly.

## Order Ticket

1. Fields: symbol, BUY/SELL, quantity, order type, DAY/GTC, conditional limit price, and conditional stop price.
2. Enforce backend-equivalent validation:
   - Positive whole-share quantity no greater than 1,000,000.
   - Positive prices with at most four decimal places.
   - LIMIT requires only limit price; STOP requires only stop price; STOP_LIMIT requires both; MARKET requires neither.
3. Show current bid/ask and a clearly labeled estimated notional using `decimal.js`; clarify that actual market fills may differ and can be partial.
4. Generate one UUID idempotency key per deliberate submission and retain it through network retry of that exact request. Generate a new key only after the form changes or the user starts a new command.
5. On `202`, show the stable order ID and `PENDING_VALIDATION`, reset only safe fields, seed the order cache, and navigate/show a tracking toast. Never claim execution at submission time.
6. For SELL, display available shares from portfolio and locally prevent obvious over-orders while still treating backend risk validation as authoritative.

## Realtime Client

1. Implement an explicit WebSocket state machine: idle, connecting, authenticating, connected, reconnecting, unauthorized, offline.
2. After socket open, send `{"type":"authenticate","token":"..."}` within 10 seconds and wait for `authenticated`.
3. Subscribe with individual messages such as `{"type":"subscribe","channel":"orders"}` for `orders`, `executions`, `portfolio`, and visible `quotes:<SYMBOL>` channels. Stay below the backend's 20-channel limit.
4. Send `{"type":"ping"}` before the backend's 45-second receive timeout; require/observe `pong` and reconnect on failure.
5. Maintain a bounded event-ID LRU set to deduplicate at-least-once messages.
6. Reconcile events:
   - Quote events update quote cache and append one point to the bounded session sparkline.
   - Order events patch visible status/progress and invalidate order detail/list queries.
   - Execution events invalidate executions, related order, and portfolio.
   - Portfolio events invalidate portfolio/positions.
7. Reconnect with capped exponential backoff plus jitter while online. After authentication or reconnection, refetch all authoritative active-screen snapshots before resubscribing; no durable event replay exists.
8. Dynamically subscribe only to quote symbols visible in the watchlist/workspace; unsubscribe when no longer needed. Subscribe once to all three account channels.

## Visual And Accessibility System

1. Use a dark graphite/navy background, slightly raised panels, off-white primary text, muted steel secondary text, green BUY/positive and red SELL/negative accents, amber stale/pending, and blue informational states.
2. Use a distinctive condensed display face for headings and a tabular-number font for prices; bundle or safely load fonts with fallbacks. Avoid generic gradient-heavy dashboard styling.
3. Prioritize information density on desktop while maintaining touch targets and horizontal table alternatives on mobile.
4. Meet WCAG 2.2 AA for contrast, keyboard navigation, focus visibility, form labels/errors, dialogs, and screen-reader announcements for order command outcomes. Do not rely on red/green alone.
5. Respect reduced motion; quote update pulses must be brief and non-disruptive.

## Failure And Edge Cases

1. Handle backend unavailable, timeout, malformed response, stale quote, empty portfolio, no executions, and WebSocket disconnected states without destroying the last good snapshot.
2. Render `409` idempotency conflict as a command conflict, not a generic retry prompt.
3. Treat `202` commands as unresolved until snapshots/events show a terminal or active state.
4. Correctly display partially filled then cancelled orders and preserve completed fills.
5. Prevent duplicate submissions from double-clicks, navigation, reconnects, and React development remount behavior.
6. Format all UTC timestamps in the user's local timezone while exposing exact timestamp details; handle DAY expiry as backend-provided UTC.
7. Cap each symbol sparkline buffer, event dedupe set, toast queue, and local realtime log to prevent long-session memory growth.

## Container And Delivery

1. Add a multi-stage Node build and unprivileged Nginx runtime image with SPA fallback, immutable hashed-asset caching, no-cache HTML, security headers, and gzip/Brotli where supported.
2. Reverse proxy `/api/v1/*` to backend `/v1/*` and `/ws/v1/ws` to backend `/v1/ws` with WebSocket upgrade headers and sensible timeouts. Keep the frontend code configured to those same-origin paths.
3. Supply an optional Compose example/override for joining the backend network, but do not modify the backend repository from the frontend implementation task.
4. Add CI for dependency install from lockfile, lint, formatting, typecheck, unit/component tests, production build, Playwright against mocked APIs, and Docker image build.

## Validation Plan

1. Unit tests:
   - Decimal formatting/arithmetic, order schema switching, idempotency-key retention, status/cancellability rules, JWT expiry, WebSocket backoff/dedupe, and sparkline bounds.
2. Component tests with MSW:
   - Login/register success and errors; dashboard loading/empty/stale/error states; all four order forms; `202` lifecycle; partial fill; cancellation; portfolio null valuation; unauthorized redirect.
3. WebSocket tests:
   - Authentication handshake, one-channel subscriptions, heartbeat, account event reconciliation, duplicate event suppression, disconnect/reconnect, and snapshot refetch after reconnect.
4. Playwright scenarios:
   - Register/login/logout and session-storage restoration.
   - Observe live quote changes and session sparkline.
   - Submit BUY MARKET, track asynchronous state, observe execution and position/cash update.
   - Submit away-market LIMIT, cancel it, and verify final state.
   - Validate STOP/STOP_LIMIT conditional fields and request bodies.
   - Responsive keyboard-accessible flows at desktop and mobile widths.
5. Contract verification:
   - Generate or fetch backend OpenAPI during CI where possible and fail on incompatible REST schema drift.
   - Maintain fixture-based compatibility tests for WebSocket messages because the socket protocol is not represented in OpenAPI.

## Implementation Order

1. Scaffold tooling, design tokens, providers, routing, test harness, and container/proxy configuration.
2. Add Zod API contracts, decimal/time utilities, fetch client, session storage, auth screens, guards, and `/me` bootstrap.
3. Build query hooks and REST snapshots for instruments, quotes, portfolio, positions, orders, events, and executions.
4. Implement shell, dashboard, watchlist, symbol workspace, and bounded session sparklines.
5. Implement order ticket, idempotent submission, orders list/detail/timeline, and cancellation.
6. Implement executions and portfolio views with null/stale handling.
7. Add WebSocket state machine, heartbeat, subscriptions, deduplication, cache reconciliation, and reconnect snapshots.
8. Complete responsive/accessibility passes, full tests, CI, Docker image, and frontend README with backend startup and demo instructions.

## Completion Criteria

- A clean checkout installs from its lockfile and starts against the backend with one documented command.
- Users can register/login, view all 15 live symbols, submit every supported order type, track lifecycle/fills, cancel eligible orders, and inspect portfolio state.
- Session expiry, backend outages, stale data, partial fills, idempotent retries, and WebSocket reconnects have explicit correct behavior.
- No financial values use JavaScript floating-point arithmetic.
- Desktop and mobile workflows are accessible and pass lint, formatting, typecheck, unit/component, Playwright, production build, and image-build checks.
