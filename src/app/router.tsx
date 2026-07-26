import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  Outlet,
} from '@tanstack/react-router';
import { LoginPage, RegisterPage } from '@/auth/AuthPages';
import { useAuth } from '@/auth/session';
import { AppShell } from '@/app/shell';
import { DashboardPage } from '@/market/DashboardPage';
import { SymbolPage } from '@/market/SymbolPage';
import { OrdersPage } from '@/orders/OrdersPage';
import { OrderDetailPage } from '@/orders/OrderDetailPage';
import { ExecutionsPage } from '@/executions/ExecutionsPage';
import { PortfolioPage } from '@/portfolio/PortfolioPage';

function RootComponent() {
  return <Outlet />;
}

function PublicOnly() {
  const auth = useAuth();
  if (auth.isAuthenticated) return <Navigate to="/dashboard" />;
  return <Outlet />;
}

function Protected() {
  const auth = useAuth();
  if (!auth.isAuthenticated) return <Navigate to="/login" />;
  return <AppShell />;
}

const rootRoute = createRootRoute({ component: RootComponent });

const publicRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'public',
  component: PublicOnly,
});
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  component: Protected,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Navigate to="/dashboard" />,
});
const loginRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/login',
  component: LoginPage,
});
const registerRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: '/register',
  component: RegisterPage,
});
const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/dashboard',
  component: DashboardPage,
});
const marketRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/markets/$symbol',
  component: SymbolPage,
});
const ordersRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/orders',
  component: OrdersPage,
});
const orderDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/orders/$orderId',
  component: OrderDetailPage,
});
const executionsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/executions',
  component: ExecutionsPage,
});
const portfolioRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/portfolio',
  component: PortfolioPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  publicRoute.addChildren([loginRoute, registerRoute]),
  protectedRoute.addChildren([
    dashboardRoute,
    marketRoute,
    ordersRoute,
    orderDetailRoute,
    executionsRoute,
    portfolioRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
