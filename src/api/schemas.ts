import { z } from 'zod';
import { SUPPORTED_SYMBOLS } from '@/lib/symbols';

export const decimalStringSchema = z.string().regex(/^-?\d+(\.\d+)?$/);
export const symbolSchema = z.enum(SUPPORTED_SYMBOLS);

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  created_at: z.string().optional(),
});

export const authResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string().optional(),
  user: userSchema.optional(),
});

export const quoteSchema = z.object({
  symbol: symbolSchema,
  bid: decimalStringSchema.nullable(),
  ask: decimalStringSchema.nullable(),
  last: decimalStringSchema.nullable(),
  bid_size: z.number().int().nonnegative().nullable().optional(),
  ask_size: z.number().int().nonnegative().nullable().optional(),
  as_of: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const accountSchema = z.object({
  id: z.string().optional(),
  cash_total: decimalStringSchema.nullable(),
  cash_available: decimalStringSchema.nullable(),
  cash_reserved: decimalStringSchema.nullable(),
  equity: decimalStringSchema.nullable().optional(),
  as_of: z.string().nullable().optional(),
});

export const positionSchema = z.object({
  symbol: symbolSchema,
  quantity: z.number().int(),
  available_quantity: z.number().int().nullable().optional(),
  reserved_quantity: z.number().int().nullable().optional(),
  average_price: decimalStringSchema.nullable(),
  market_price: decimalStringSchema.nullable().optional(),
  market_value: decimalStringSchema.nullable().optional(),
  realized_pnl: decimalStringSchema.nullable().optional(),
  unrealized_pnl: decimalStringSchema.nullable().optional(),
  as_of: z.string().nullable().optional(),
});

export const orderSideSchema = z.enum(['BUY', 'SELL']);
export const orderTypeSchema = z.enum(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT']);
export const timeInForceSchema = z.enum(['DAY', 'GTC']);
export const orderStatusSchema = z.enum([
  'PENDING_VALIDATION',
  'ACCEPTED',
  'ACTIVE',
  'PARTIALLY_FILLED',
  'FILLED',
  'REJECTED',
  'CANCEL_PENDING',
  'CANCELLED',
  'EXPIRED',
  'FAILED',
]);

export const orderSchema = z.object({
  id: z.string(),
  symbol: symbolSchema,
  side: orderSideSchema,
  order_type: orderTypeSchema,
  quantity: z.number().int().positive(),
  time_in_force: timeInForceSchema,
  status: orderStatusSchema,
  limit_price: decimalStringSchema.nullable().optional(),
  stop_price: decimalStringSchema.nullable().optional(),
  filled_quantity: z.number().int().nonnegative().optional(),
  average_fill_price: decimalStringSchema.nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
});

export const orderEventSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  status: orderStatusSchema,
  message: z.string().nullable().optional(),
  created_at: z.string(),
});

export const executionSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  symbol: symbolSchema,
  side: orderSideSchema,
  quantity: z.number().int().positive(),
  price: decimalStringSchema,
  executed_at: z.string(),
});

export const listSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.union([
    z.array(item),
    z.object({
      items: z.array(item),
      limit: z.number().optional(),
      next_cursor: z.string().nullable().optional(),
    }),
  ]);

export type User = z.infer<typeof userSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type Quote = z.infer<typeof quoteSchema>;
export type Account = z.infer<typeof accountSchema>;
export type Position = z.infer<typeof positionSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderEvent = z.infer<typeof orderEventSchema>;
export type Execution = z.infer<typeof executionSchema>;
export type OrderSide = z.infer<typeof orderSideSchema>;
export type OrderType = z.infer<typeof orderTypeSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type TimeInForce = z.infer<typeof timeInForceSchema>;
