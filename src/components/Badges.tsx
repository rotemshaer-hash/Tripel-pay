type Props = { size?: number };

export function BadgeStar({ size = 64 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <polygon points="100,10 178,55 178,145 100,190 22,145 22,55" fill="var(--coral-600)" />
      <polygon points="100,22 167,61 167,139 100,178 33,139 33,61" fill="var(--violet-700)" />
      <polygon points="100,45 115,75 148,80 124,103 130,135 100,120 70,135 76,103 52,80 85,75" fill="var(--amber-600)" />
    </svg>
  );
}

export function BadgeFlame({ size = 64 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <polygon points="100,10 178,55 178,145 100,190 22,145 22,55" fill="var(--teal-700)" />
      <polygon points="100,22 167,61 167,139 100,178 33,139 33,61" fill="var(--violet-700)" />
      <path d="M100 45 C115 70 135 85 135 115 C135 138 119 150 100 150 C81 150 65 138 65 115 C65 90 85 75 100 45 Z" fill="var(--teal-700)" />
      <path d="M100 85 C108 100 118 110 118 125 C118 135 110 142 100 142 C90 142 82 135 82 125 C82 110 92 100 100 85 Z" fill="var(--amber-600)" />
    </svg>
  );
}

export function BadgeCheck({ size = 64 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <polygon points="100,10 178,55 178,145 100,190 22,145 22,55" fill="var(--violet-500)" />
      <polygon points="100,22 167,61 167,139 100,178 33,139 33,61" fill="var(--violet-700)" />
      <path d="M55 135 L85 110 L115 125 L145 65" fill="none" stroke="var(--coral-600)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="145,65 125,70 140,85" fill="var(--coral-600)" />
    </svg>
  );
}

export function BadgeCoin({ size = 64 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <polygon points="100,10 178,55 178,145 100,190 22,145 22,55" fill="var(--amber-600)" />
      <polygon points="100,22 167,61 167,139 100,178 33,139 33,61" fill="var(--violet-700)" />
      <circle cx="100" cy="100" r="42" fill="var(--amber-600)" />
      <text x="100" y="115" fontSize="45" fontWeight="bold" fill="var(--violet-700)" textAnchor="middle">
        ₪
      </text>
    </svg>
  );
}
