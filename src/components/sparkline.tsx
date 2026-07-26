import Decimal from 'decimal.js';

type Point = { value: string; at: number };

export function Sparkline({ points }: { points: readonly Point[] }) {
  if (points.length < 2)
    return <div className="h-12 text-xs text-steel">Collecting session data</div>;

  const decimals = points.map((point) => new Decimal(point.value));
  const min = Decimal.min(...decimals);
  const max = Decimal.max(...decimals);
  const span = max.minus(min);
  const width = 180;
  const height = 44;
  const path = points
    .map((point, index) => {
      const x = new Decimal(index).div(points.length - 1).mul(width);
      const y = span.eq(0)
        ? new Decimal(height / 2)
        : new Decimal(height).minus(new Decimal(point.value).minus(min).div(span).mul(height));
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg
      role="img"
      aria-label="Session-only price sparkline"
      viewBox={`0 0 ${width} ${height}`}
      className="h-12 w-full overflow-visible"
    >
      <path
        d={path}
        fill="none"
        stroke="#31d084"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
