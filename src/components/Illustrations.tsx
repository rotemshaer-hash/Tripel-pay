type Props = { size?: number };

export function ScenePiggyBank({ size = 140 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 400 400" fill="none">
      <path d="M140 120 C90 120 75 180 75 250 C75 310 95 330 140 330 C185 330 205 310 205 250 C205 180 190 120 140 120 Z" fill="var(--coral-600)" />
      <path d="M140 210 C110 210 100 240 100 280 C100 310 115 320 140 320 C165 320 180 310 180 280 C180 240 170 210 140 210 Z" fill="var(--teal-700)" />
      <circle cx="120" cy="180" r="8" fill="var(--ink)" />
      <circle cx="165" cy="180" r="8" fill="var(--ink)" />
      <ellipse cx="280" cy="260" rx="65" ry="50" fill="var(--teal-700)" />
      <ellipse cx="340" cy="260" rx="15" ry="12" fill="var(--teal-900)" />
      <circle cx="335" cy="260" r="3" fill="#ffffff" />
      <circle cx="345" cy="260" r="3" fill="#ffffff" />
      <path d="M250 215 Q260 190 275 210 Z" fill="var(--teal-900)" />
      <rect x="240" y="300" width="14" height="25" rx="7" fill="var(--teal-900)" />
      <rect x="300" y="300" width="14" height="25" rx="7" fill="var(--teal-900)" />
      <rect x="270" y="205" width="20" height="5" fill="var(--ink)" />
      <circle cx="280" cy="175" r="18" fill="var(--amber-600)" />
    </svg>
  );
}

export function SceneGraduation({ size = 140 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 400 400" fill="none">
      <polygon points="200,40 280,70 200,100 120,70" fill="var(--violet-700)" />
      <rect x="160" y="75" width="80" height="25" fill="var(--violet-700)" />
      <path d="M260 75 L275 110 L270 110 L255 75 Z" fill="var(--amber-600)" />
      <circle cx="272" cy="115" r="6" fill="var(--amber-600)" />
      <path d="M200 100 C130 100 110 170 110 260 C110 330 140 350 200 350 C260 350 290 330 290 260 C290 170 270 100 200 100 Z" fill="var(--coral-600)" />
      <path d="M200 210 C160 210 145 250 145 300 C145 330 165 340 200 340 C235 340 255 330 255 300 C255 250 240 210 200 210 Z" fill="var(--teal-700)" />
      <ellipse cx="165" cy="175" rx="10" ry="14" fill="var(--ink)" />
      <ellipse cx="235" cy="175" rx="10" ry="14" fill="var(--ink)" />
      <path d="M150 280 Q200 270 200 295 Q200 270 250 280 L255 320 Q200 310 200 325 Q200 310 145 320 Z" fill="#ffffff" stroke="var(--violet-700)" strokeWidth="4" />
    </svg>
  );
}

export function SceneBroom({ size = 140 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 400 400" fill="none">
      <rect x="220" y="240" width="140" height="15" rx="5" fill="var(--violet-500)" />
      <rect x="240" y="255" width="15" height="90" fill="var(--violet-700)" />
      <rect x="320" y="255" width="15" height="90" fill="var(--violet-700)" />
      <line x1="120" y1="180" x2="60" y2="340" stroke="var(--violet-700)" strokeWidth="10" strokeLinecap="round" />
      <polygon points="40,340 80,340 90,370 30,370" fill="var(--amber-600)" />
      <path d="M180 140 C130 140 115 200 115 270 C115 320 135 340 180 340 C225 340 245 320 245 270 C245 200 230 140 180 140 Z" fill="var(--coral-600)" />
      <path d="M180 230 C155 230 145 260 145 295 C145 320 160 330 180 330 C200 330 215 320 215 295 C215 260 205 230 180 230 Z" fill="var(--teal-700)" />
      <circle cx="160" cy="190" r="7" fill="var(--ink)" />
      <circle cx="200" cy="190" r="7" fill="var(--ink)" />
      <path d="M280 180 L285 195 L300 200 L285 205 L280 220 L275 205 L260 200 L275 195 Z" fill="var(--amber-600)" />
    </svg>
  );
}

export function SceneGrowth({ size = 140 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 400 400" fill="none">
      <path d="M60 280 L140 220 L220 240 L340 110" fill="none" stroke="var(--coral-600)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M60 280 L140 220 L220 240 L340 110 L340 320 L60 320 Z" fill="var(--coral-600)" opacity="0.15" />
      <circle cx="140" cy="220" r="16" fill="var(--amber-600)" />
      <circle cx="220" cy="240" r="16" fill="var(--amber-600)" />
      <circle cx="340" cy="110" r="22" fill="var(--amber-600)" />
      <text x="340" y="118" fontSize="22" fontWeight="bold" fill="var(--violet-700)" textAnchor="middle">₪</text>
      <path d="M110 160 C75 160 65 210 65 270 C65 310 80 325 110 325 C140 325 155 310 155 270 C155 210 145 160 110 160 Z" fill="var(--coral-600)" />
      <circle cx="95" cy="200" r="6" fill="var(--ink)" />
      <circle cx="125" cy="200" r="6" fill="var(--ink)" />
    </svg>
  );
}

export function SceneLedger({ size = 140 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 400 400" fill="none">
      <circle cx="130" cy="110" r="20" fill="var(--amber-600)" />
      <text x="130" y="117" fontSize="20" fontWeight="bold" fill="var(--violet-700)" textAnchor="middle">₪</text>
      <polygon points="270,90 280,110 300,110 285,125 290,145 270,132 250,145 255,125 240,110 260,110" fill="var(--teal-700)" />
      <path d="M200 160 C140 160 120 220 120 300 C120 340 145 355 200 355 C255 355 280 340 280 300 C280 220 260 160 200 160 Z" fill="var(--coral-600)" />
      <ellipse cx="170" cy="220" rx="9" ry="12" fill="var(--ink)" />
      <ellipse cx="230" cy="220" rx="9" ry="12" fill="var(--ink)" />
      <rect x="140" y="270" width="120" height="70" rx="8" fill="var(--violet-700)" />
      <rect x="145" y="275" width="110" height="60" rx="5" fill="#ffffff" />
      <line x1="200" y1="275" x2="200" y2="335" stroke="var(--violet-700)" strokeWidth="4" />
    </svg>
  );
}

export function SceneRest({ size = 140 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 400 400" fill="none">
      <rect x="110" y="200" width="180" height="130" rx="20" fill="var(--violet-700)" />
      <path d="M110 200 Q200 240 290 200 L290 170 Q200 200 110 170 Z" fill="var(--violet-500)" />
      <circle cx="260" cy="265" r="12" fill="var(--amber-600)" />
      <path d="M200 70 C150 70 135 120 135 190 L265 190 C265 120 250 70 200 70 Z" fill="var(--coral-600)" />
      <circle cx="175" cy="130" r="9" fill="var(--ink)" />
      <circle cx="225" cy="130" r="9" fill="var(--ink)" />
      <path d="M185 155 Q200 145 215 155" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function SceneAchievementBadge({ size = 140 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 400 400" fill="none">
      <circle cx="200" cy="140" r="60" fill="var(--amber-600)" />
      <path d="M170 140 L190 160 L230 120" stroke="#ffffff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M200 180 C140 180 120 240 120 320 C120 350 145 360 200 360 C255 360 280 350 280 320 C280 240 260 180 200 180 Z" fill="var(--coral-600)" />
      <path d="M200 260 C165 260 150 285 150 320 C150 345 170 350 200 350 C230 350 250 345 250 320 C250 285 235 260 200 260 Z" fill="var(--teal-700)" />
      <path d="M160 230 Q175 215 190 230" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M210 230 Q225 215 240 230" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function HeroBanner({ width = 400, height = 200 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 800 400" fill="none">
      <circle cx="150" cy="100" r="80" fill="var(--violet-500)" opacity="0.1" />
      <circle cx="680" cy="280" r="100" fill="var(--coral-600)" opacity="0.1" />
      <circle cx="120" cy="160" r="30" fill="var(--amber-600)" />
      <text x="120" y="171" fontSize="30" fontWeight="bold" fill="var(--violet-700)" textAnchor="middle">₪</text>
      <polygon points="180,70 190,90 210,90 195,105 200,125 180,112 160,125 165,105 150,90 170,90" fill="var(--teal-700)" />
      <path d="M600 120 L640 90 L680 140 L740 70" fill="none" stroke="var(--coral-600)" strokeWidth="8" strokeLinecap="round" />
      <circle cx="680" cy="220" r="28" fill="var(--amber-600)" />
      <text x="680" y="231" fontSize="30" fontWeight="bold" fill="var(--violet-700)" textAnchor="middle">₪</text>
      <g transform="translate(200, 0)">
        <path d="M200 60 C130 60 110 140 110 240 C110 320 140 340 200 340 C260 340 290 320 290 240 C290 140 270 60 200 60 Z" fill="var(--coral-600)" />
        <path d="M200 180 C160 180 145 220 145 270 C145 310 165 325 200 325 C235 325 255 310 255 270 C255 220 240 180 200 180 Z" fill="var(--teal-700)" />
        <ellipse cx="165" cy="150" rx="12" ry="16" fill="var(--ink)" />
        <ellipse cx="235" cy="150" rx="12" ry="16" fill="var(--ink)" />
        <circle cx="161" cy="144" r="5" fill="#ffffff" />
        <circle cx="231" cy="144" r="5" fill="#ffffff" />
        <rect x="180" y="175" width="40" height="6" rx="3" fill="var(--ink)" />
      </g>
    </svg>
  );
}
