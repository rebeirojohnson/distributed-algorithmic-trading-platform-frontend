import { Link, Outlet } from '@tanstack/react-router';
import {
  BarChart3,
  BriefcaseBusiness,
  ClipboardList,
  Gauge,
  LogOut,
  ReceiptText,
} from 'lucide-react';
import { Button, StatusChip } from '@/components/ui';
import { useAuth } from '@/auth/session';
import { useAccount } from '@/api/queries';
import { formatMoney } from '@/lib/decimal';
import { useRealtime } from '@/realtime/RealtimeProvider';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/executions', label: 'Fills', icon: ReceiptText },
  { to: '/portfolio', label: 'Portfolio', icon: BriefcaseBusiness },
  { to: '/markets/AAPL', label: 'Markets', icon: BarChart3 },
] as const;

export function AppShell() {
  const auth = useAuth();
  const account = useAccount();
  const realtime = useRealtime();

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-64 border-r border-white/10 bg-graphite-950/95 p-4 md:block">
        <div className="mb-8">
          <p className="font-display text-2xl font-black uppercase tracking-[0.18em]">
            Paper Terminal
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-pending">Simulated Trading</p>
        </div>
        <nav className="grid gap-2" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} {...item} />
          ))}
        </nav>
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-graphite-950/90 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-steel">Available Cash</p>
              <p className="numeric text-xl font-semibold text-white">
                {formatMoney(account.data?.cash_available)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusChip
                tone={
                  realtime.state === 'connected'
                    ? 'buy'
                    : realtime.state === 'offline'
                      ? 'sell'
                      : 'pending'
                }
              >
                {realtime.state}
              </StatusChip>
              <span className="hidden text-sm text-steel sm:inline">{auth.user?.email}</span>
              <Button
                type="button"
                className="px-3"
                onClick={() => auth.logout(null)}
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <Outlet />
        </main>
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-white/10 bg-graphite-950 md:hidden"
        aria-label="Mobile navigation"
      >
        {navItems.map((item) => (
          <NavLink key={item.to} {...item} compact />
        ))}
      </nav>
    </div>
  );
}

function NavLink({
  to,
  label,
  icon: Icon,
  compact = false,
}: {
  to: string;
  label: string;
  icon: typeof Gauge;
  compact?: boolean;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-steel hover:bg-white/5 hover:text-white [&.active]:bg-info/15 [&.active]:text-white"
    >
      <Icon className="h-4 w-4" />
      <span className={compact ? 'text-[11px]' : ''}>{label}</span>
    </Link>
  );
}
