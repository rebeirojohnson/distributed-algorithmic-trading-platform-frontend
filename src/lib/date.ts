export function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(date);
}

export function isStaleTimestamp(value: string | null | undefined, maxAgeMs = 15_000): boolean {
  if (!value) return true;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return true;
  return Date.now() - timestamp > maxAgeMs;
}
