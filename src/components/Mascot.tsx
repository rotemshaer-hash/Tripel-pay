export type MascotPose = "tasks" | "saving" | "learning" | "celebrate" | "plain";

// "Pip" — an original mascot with a swappable antenna accessory (or full face swap
// for celebrate/saving) per context. Invented for this app; not a copy of anyone
// else's character.
export function Mascot({ size = 120, pose = "plain" }: { size?: number; pose?: MascotPose }) {
  const celebrating = pose === "celebrate";
  const showAntenna = pose === "tasks" || pose === "learning";

  return (
    <svg width={size} height={size} viewBox="0 -80 400 420" fill="none">
      {celebrating && (
        <>
          <circle cx="90" cy="70" r="8" fill="var(--amber-600)" />
          <rect x="290" y="60" width="14" height="14" rx="3" fill="var(--teal-700)" transform="rotate(15 290 60)" />
          <circle cx="320" cy="160" r="10" fill="var(--violet-500)" />
          <rect x="70" y="180" width="12" height="12" rx="3" fill="var(--coral-600)" transform="rotate(-20 70 180)" />
          <path d="M125 190Q90 150 85 125Q100 120 120 160Z" fill="var(--coral-600)" />
          <path d="M275 190Q310 150 315 125Q300 120 280 160Z" fill="var(--coral-600)" />
        </>
      )}

      <path d="M200 60 C130 60 110 140 110 230 C110 310 140 340 200 340 C260 340 290 310 290 230 C290 140 270 60 200 60 Z" fill="var(--coral-600)" />
      <path d="M200 180 C160 180 145 220 145 270 C145 310 165 325 200 325 C235 325 255 310 255 270 C255 220 240 180 200 180 Z" fill="var(--teal-700)" />

      {celebrating ? (
        <>
          <path d="M150 145Q165 125 180 145" stroke="var(--ink)" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M220 145Q235 125 250 145" stroke="var(--ink)" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M175 165Q200 195 225 165Z" fill="var(--ink)" />
        </>
      ) : (
        <>
          <ellipse cx="165" cy="150" rx="12" ry="16" fill="var(--ink)" />
          <ellipse cx="235" cy="150" rx="12" ry="16" fill="var(--ink)" />
          <circle cx="161" cy="144" r="5" fill="#ffffff" />
          <circle cx="231" cy="144" r="5" fill="#ffffff" />
          <rect x="180" y="175" width="40" height="6" rx="3" fill="var(--ink)" />
          <ellipse cx="145" cy="165" rx="8" ry="5" fill="var(--teal-700)" opacity="0.4" />
          <ellipse cx="255" cy="165" rx="8" ry="5" fill="var(--teal-700)" opacity="0.4" />
        </>
      )}

      {pose === "saving" && (
        <>
          <circle cx="200" cy="250" r="55" fill="var(--amber-600)" stroke="var(--ink)" strokeWidth="4" />
          <circle cx="200" cy="250" r="42" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.6" />
          <text x="200" y="265" fontSize="45" fontWeight="bold" fill="var(--violet-700)" textAnchor="middle">
            ₪
          </text>
        </>
      )}

      {showAntenna && <path d="M200 60C200 30 200 5 200 -20" stroke="var(--teal-900)" strokeWidth="8" strokeLinecap="round" />}
      {pose === "tasks" && (
        <>
          <circle cx="200" cy="-32" r="24" fill="var(--amber-600)" />
          <path d="M188 -32 197 -22 214 -44" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      )}
      {pose === "learning" && (
        <>
          <rect x="160" y="-46" width="80" height="22" rx="6" fill="var(--violet-700)" />
          <rect x="186" y="-24" width="28" height="18" fill="var(--violet-700)" />
        </>
      )}
    </svg>
  );
}
