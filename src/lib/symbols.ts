export const SUPPORTED_SYMBOLS = [
  'AAPL',
  'MSFT',
  'GOOGL',
  'AMZN',
  'META',
  'NVDA',
  'TSLA',
  'JPM',
  'V',
  'JNJ',
  'WMT',
  'PG',
  'XOM',
  'KO',
  'DIS',
] as const;

export type SymbolCode = (typeof SUPPORTED_SYMBOLS)[number];

export function isSupportedSymbol(value: string): value is SymbolCode {
  return SUPPORTED_SYMBOLS.includes(value.toUpperCase() as SymbolCode);
}
