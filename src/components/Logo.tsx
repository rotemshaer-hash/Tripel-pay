import { V } from "../data/vocabulary";

export function Logo({ size = 64 }: { size?: number }) {
  const u = size / 24;
  const marker = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={9 * u} height={9 * u} rx={2 * u} fill="var(--violet-700)" />
      <rect x={x + 2 * u} y={y + 2 * u} width={5 * u} height={5 * u} rx={1 * u} fill="#fff" />
      <rect x={x + 3.5 * u} y={y + 3.5 * u} width={2 * u} height={2 * u} fill="#1a1a1a" />
    </g>
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={V.appName}>
      {marker(0, 0)}
      {marker(11 * u, 0)}
      {marker(0, 11 * u)}
      {/* teal pixel "P" mark, bottom-right cell */}
      <rect x={11 * u} y={11 * u} width={3.5 * u} height={9 * u} rx={1 * u} fill="var(--teal-700)" />
      <rect x={14.5 * u} y={11 * u} width={5.5 * u} height={3.5 * u} rx={1 * u} fill="var(--teal-700)" />
      <rect x={16.5 * u} y={16.5 * u} width={3.5 * u} height={3.5 * u} rx={1 * u} fill="var(--teal-700)" />
    </svg>
  );
}
