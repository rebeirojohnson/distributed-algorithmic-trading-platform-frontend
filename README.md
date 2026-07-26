# distributed-algorithmic-trading-platform-frontend

React/Vite frontend for the paper-trading backend.

## Run Locally

```bash
npm ci
npm run dev
```

The development server proxies `/api/v1` and `/ws/v1/ws` to `http://localhost:8000`. Override with `VITE_API_BASE_URL` and `VITE_WS_URL` only for intentional cross-origin deployments.

## Run With Docker Compose

```bash
docker compose up --build
```

The Nginx runtime serves the SPA on `http://localhost:5173` and proxies `/api/v1/*` plus `/ws/v1/ws` to the backend gateway reachable as `gateway:8000` on the backend Compose network `trading-platform_default`.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run e2e
```

Financial values are parsed as decimal strings and formatted with `decimal.js`; do not use binary floating point for trading calculations.
