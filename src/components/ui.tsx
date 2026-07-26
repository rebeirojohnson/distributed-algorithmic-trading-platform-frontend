import { clsx } from 'clsx';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        'inline-flex min-h-10 items-center justify-center rounded border border-info/40 bg-info/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-info/25 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export function DangerButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button className={clsx('border-sell/50 bg-sell/15 hover:bg-sell/25', className)} {...props} />
  );
}

export function Card({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx('terminal-panel rounded-xl p-4', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          {title && (
            <h2 className="font-display text-lg font-bold uppercase tracking-[0.18em] text-white">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm text-steel">
      <span>{label}</span>
      {children}
      {error && (
        <span className="text-xs text-sell" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="min-h-10 rounded border border-white/10 bg-graphite-950 px-3 py-2 text-white placeholder:text-steel/60"
      {...props}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="min-h-10 rounded border border-white/10 bg-graphite-950 px-3 py-2 text-white"
      {...props}
    />
  );
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.02] p-5 text-sm text-steel">
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-1">{detail}</p>
    </div>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : 'Something went wrong.';
  return (
    <div className="rounded-lg border border-sell/30 bg-sell/10 p-4 text-sm text-sell">
      {message}
    </div>
  );
}

export function StatusChip({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'buy' | 'sell' | 'pending' | 'info' | 'neutral';
}) {
  const tones = {
    buy: 'border-buy/40 bg-buy/10 text-buy',
    sell: 'border-sell/40 bg-sell/10 text-sell',
    pending: 'border-pending/40 bg-pending/10 text-pending',
    info: 'border-info/40 bg-info/10 text-info',
    neutral: 'border-white/15 bg-white/5 text-steel',
  };
  return (
    <span
      className={clsx(
        'inline-flex rounded-full border px-2 py-1 text-xs font-semibold',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-2" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-10 animate-pulse rounded bg-white/5" />
      ))}
    </div>
  );
}
