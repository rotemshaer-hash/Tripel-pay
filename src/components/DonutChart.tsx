export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({ slices, size = 140, thickness = 22 }: { slices: DonutSlice[]; size?: number; thickness?: number }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offsetSoFar = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--line)" strokeWidth={thickness} />
      {slices.map((s, i) => {
        const pct = s.value / total;
        const dash = pct * circumference;
        const el = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offsetSoFar}
            strokeLinecap="butt"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
        offsetSoFar += dash;
        return el;
      })}
    </svg>
  );
}
