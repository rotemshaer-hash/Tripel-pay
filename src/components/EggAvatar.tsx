import { useId } from "react";

// The same egg/blob silhouette used by the app's mascot (see Mascot.tsx) and icon
// set — reused here as a clip path so every avatar in the app reads as "one of ours"
// instead of a generic circle.
const EGG_PATH =
  "M200 60 C130 60 110 140 110 230 C110 310 140 340 200 340 C260 340 290 310 290 230 C290 140 270 60 200 60 Z";

export function EggAvatar({
  photoUrl,
  color,
  initial,
  size = 72,
}: {
  photoUrl?: string;
  color: string;
  initial: string;
  size?: number;
}) {
  const clipId = useId();
  const height = size * (300 / 260);

  return (
    <svg width={size} height={height} viewBox="80 40 220 320">
      <defs>
        <clipPath id={clipId}>
          <path d={EGG_PATH} />
        </clipPath>
      </defs>
      {photoUrl ? (
        <image href={photoUrl} x="80" y="40" width="220" height="320" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId})`} />
      ) : (
        <>
          <path d={EGG_PATH} fill={color} clipPath={`url(#${clipId})`} />
          <text x="200" y="212" fontSize="130" fontWeight="800" fill="#ffffff" textAnchor="middle" dominantBaseline="middle">
            {initial}
          </text>
        </>
      )}
    </svg>
  );
}
