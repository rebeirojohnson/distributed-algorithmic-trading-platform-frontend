import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApiError } from '@/api/client';
import { useCreateOrder, usePositions, useQuote } from '@/api/queries';
import type { CreateOrderInput } from '@/api/endpoints';
import { Button, Card, Field, Input, Select, StatusChip } from '@/components/ui';
import { createIdempotencyKey } from '@/lib/id';
import { formatPrice, hasMaxFourDecimals, isPositiveDecimal, multiplyDecimal } from '@/lib/decimal';
import { SUPPORTED_SYMBOLS, type SymbolCode } from '@/lib/symbols';

const orderTicketSchema = z
  .object({
    symbol: z.enum(SUPPORTED_SYMBOLS),
    side: z.enum(['BUY', 'SELL']),
    quantity: z.coerce
      .number()
      .int('Use whole shares.')
      .positive('Quantity must be positive.')
      .max(1_000_000),
    order_type: z.enum(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT']),
    time_in_force: z.enum(['DAY', 'GTC']),
    limit_price: z.string().optional(),
    stop_price: z.string().optional(),
  })
  .superRefine((value, context) => {
    validatePrice(
      'limit_price',
      value.limit_price,
      value.order_type === 'LIMIT' || value.order_type === 'STOP_LIMIT',
      context,
    );
    validatePrice(
      'stop_price',
      value.stop_price,
      value.order_type === 'STOP' || value.order_type === 'STOP_LIMIT',
      context,
    );
    if (value.order_type === 'MARKET' && (value.limit_price || value.stop_price)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['limit_price'],
        message: 'Market orders do not use prices.',
      });
    }
  });

type OrderTicketForm = z.infer<typeof orderTicketSchema>;

export function OrderTicket({ symbol = 'AAPL' }: { symbol?: SymbolCode }) {
  const createOrder = useCreateOrder();
  const positions = usePositions();
  const quote = useQuote(symbol);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const keyRef = useRef(createIdempotencyKey());
  const form = useForm<OrderTicketForm>({
    resolver: zodResolver(orderTicketSchema),
    defaultValues: {
      symbol,
      side: 'BUY',
      quantity: 1,
      order_type: 'MARKET',
      time_in_force: 'DAY',
      limit_price: '',
      stop_price: '',
    },
  });
  const orderType = form.watch('order_type');
  const selectedSymbol = form.watch('symbol');
  const side = form.watch('side');
  const quantity = form.watch('quantity');
  const selectedQuote = selectedSymbol === symbol ? quote.data : undefined;
  const position = positions.data?.find((item) => item.symbol === selectedSymbol);
  const availableShares = position?.available_quantity ?? position?.quantity ?? 0;
  const referencePrice = selectedQuote?.ask ?? selectedQuote?.last ?? selectedQuote?.bid;
  const estimatedNotional = useMemo(() => {
    if (!referencePrice || !quantity || Number.isNaN(quantity)) return null;
    return multiplyDecimal(referencePrice, String(quantity)).toFixed(2);
  }, [quantity, referencePrice]);

  useEffect(() => {
    const subscription = form.watch(() => {
      keyRef.current = createIdempotencyKey();
      setSubmittedId(null);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (values.side === 'SELL' && values.quantity > availableShares) {
      form.setError('quantity', {
        message: `Only ${availableShares} shares are locally available.`,
      });
      return;
    }
    const input: CreateOrderInput = {
      symbol: values.symbol,
      side: values.side,
      quantity: values.quantity,
      order_type: values.order_type,
      time_in_force: values.time_in_force,
      limit_price: values.limit_price || null,
      stop_price: values.stop_price || null,
    };
    try {
      const order = await createOrder.mutateAsync({ input, idempotencyKey: keyRef.current });
      setSubmittedId(order.id);
      keyRef.current = createIdempotencyKey();
      form.reset({
        ...values,
        quantity: 1,
        limit_price:
          values.order_type === 'LIMIT' || values.order_type === 'STOP_LIMIT'
            ? values.limit_price
            : '',
        stop_price:
          values.order_type === 'STOP' || values.order_type === 'STOP_LIMIT'
            ? values.stop_price
            : '',
      });
    } catch (error) {
      const message =
        error instanceof ApiError && error.kind === 'conflict'
          ? 'This command conflicts with an existing idempotency key.'
          : error instanceof Error
            ? error.message
            : 'Order submission failed.';
      form.setError('root', { message });
    }
  });

  return (
    <Card title="Order Ticket">
      <form className="grid gap-4" onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Symbol" error={form.formState.errors.symbol?.message}>
            <Select {...form.register('symbol')}>
              {SUPPORTED_SYMBOLS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="Side" error={form.formState.errors.side?.message}>
            <Select {...form.register('side')}>
              <option>BUY</option>
              <option>SELL</option>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity" error={form.formState.errors.quantity?.message}>
            <Input type="number" min="1" max="1000000" step="1" {...form.register('quantity')} />
          </Field>
          <Field label="Time In Force" error={form.formState.errors.time_in_force?.message}>
            <Select {...form.register('time_in_force')}>
              <option>DAY</option>
              <option>GTC</option>
            </Select>
          </Field>
        </div>
        <Field label="Order Type" error={form.formState.errors.order_type?.message}>
          <Select {...form.register('order_type')}>
            <option>MARKET</option>
            <option>LIMIT</option>
            <option>STOP</option>
            <option>STOP_LIMIT</option>
          </Select>
        </Field>
        {(orderType === 'LIMIT' || orderType === 'STOP_LIMIT') && (
          <Field label="Limit Price" error={form.formState.errors.limit_price?.message}>
            <Input inputMode="decimal" {...form.register('limit_price')} />
          </Field>
        )}
        {(orderType === 'STOP' || orderType === 'STOP_LIMIT') && (
          <Field label="Stop Price" error={form.formState.errors.stop_price?.message}>
            <Input inputMode="decimal" {...form.register('stop_price')} />
          </Field>
        )}
        <div className="rounded-lg border border-white/10 bg-graphite-950 p-3 text-sm text-steel">
          <div className="flex justify-between">
            <span>Bid / Ask</span>
            <span className="numeric">
              {formatPrice(selectedQuote?.bid)} / {formatPrice(selectedQuote?.ask)}
            </span>
          </div>
          <div className="mt-2 flex justify-between">
            <span>Estimated notional</span>
            <span className="numeric">
              {estimatedNotional ? `$${estimatedNotional}` : 'Unavailable'}
            </span>
          </div>
          {side === 'SELL' && (
            <div className="mt-2 flex justify-between">
              <span>Available shares</span>
              <span className="numeric">{availableShares}</span>
            </div>
          )}
          <p className="mt-3 text-xs">
            Market fills may differ, can be partial, and are not complete until backend events or
            snapshots confirm them.
          </p>
        </div>
        {submittedId && (
          <StatusChip tone="pending">Accepted as {submittedId}: PENDING_VALIDATION</StatusChip>
        )}
        {form.formState.errors.root?.message && (
          <p className="text-sm text-sell" role="alert">
            {form.formState.errors.root.message}
          </p>
        )}
        <Button type="submit" disabled={createOrder.isPending}>
          {createOrder.isPending ? 'Submitting...' : 'Submit Order'}
        </Button>
      </form>
    </Card>
  );
}

function validatePrice(
  path: 'limit_price' | 'stop_price',
  value: string | undefined,
  required: boolean,
  context: z.RefinementCtx,
): void {
  if (!required && value) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message: 'This price is not valid for the selected order type.',
    });
    return;
  }
  if (!required) return;
  if (!value) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: [path], message: 'Price is required.' });
    return;
  }
  if (!isPositiveDecimal(value) || !hasMaxFourDecimals(value)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message: 'Use a positive price with at most four decimals.',
    });
  }
}
