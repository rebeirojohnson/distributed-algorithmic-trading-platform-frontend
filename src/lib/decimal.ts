import Decimal from 'decimal.js';

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export function toDecimal(value: string | null | undefined): Decimal | null {
  if (value === null || value === undefined || value === '') return null;
  return new Decimal(value);
}

export function multiplyDecimal(left: string, right: string): Decimal {
  return new Decimal(left).mul(new Decimal(right));
}

export function formatMoney(value: string | Decimal | null | undefined): string {
  if (value === null || value === undefined) return 'Unavailable';
  const decimal = typeof value === 'string' ? new Decimal(value) : value;
  return `$${decimal.toFixed(2)}`;
}

export function formatPrice(value: string | Decimal | null | undefined): string {
  if (value === null || value === undefined) return 'Unavailable';
  const decimal = typeof value === 'string' ? new Decimal(value) : value;
  return `$${decimal.toFixed(4)}`;
}

export function formatQuantity(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '0';
  return String(value);
}

export function isPositiveDecimal(value: string): boolean {
  try {
    return new Decimal(value).gt(0);
  } catch {
    return false;
  }
}

export function hasMaxFourDecimals(value: string): boolean {
  return /^\d+(\.\d{1,4})?$/.test(value);
}
