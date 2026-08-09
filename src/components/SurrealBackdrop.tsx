// A deliberately over-the-top decorative layer for one hero screen — drifting stars,
// a melting coin, and a cloud, scattered over a slow-shifting gradient sky. Purely
// decorative (aria-hidden), absolutely positioned within whatever bounded, positioned
// container it's dropped into.
function Star({ size = 16, color = "#ffffff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 1 L14.5 9 L23 12 L14.5 15 L12 23 L9.5 15 L1 12 L9.5 9 Z" fill={color} />
    </svg>
  );
}

function MeltingCoin({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 40 52" fill="none">
      <path
        d="M20 4 C30 4 36 11 36 20 C36 27 32 30 28 33 C24 36 22 40 22 46 C22 49 20 50 18 48 C14 44 8 34 8 22 C8 11 12 4 20 4 Z"
        fill="var(--amber-600)"
      />
      <text x="20" y="24" fontSize="14" fontWeight="800" fill="var(--ink)" textAnchor="middle">
        ₪
      </text>
    </svg>
  );
}

function CloudBlob({ size = 46, color = "#ffffff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 60 36" fill="none">
      <path
        d="M14 30 C6 30 2 25 4 19 C6 13 12 12 15 14 C16 7 24 3 31 6 C36 2 46 3 48 11 C55 11 58 17 54 22 C57 25 55 30 49 30 Z"
        fill={color}
      />
    </svg>
  );
}

export function SurrealBackdrop() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }} aria-hidden="true">
      <div className="surreal-shape" style={{ top: 18, insetInlineStart: 24, animationDuration: "6s", opacity: 0.85 }}>
        <Star size={14} />
      </div>
      <div className="surreal-shape" style={{ top: 44, insetInlineEnd: 36, animationDuration: "7.5s", animationDelay: "-2s", opacity: 0.7 }}>
        <Star size={10} color="var(--amber-600)" />
      </div>
      <div className="surreal-shape" style={{ top: 96, insetInlineStart: "42%", animationDuration: "5s", animationDelay: "-1s", opacity: 0.55 }}>
        <Star size={8} />
      </div>
      <div className="surreal-shape" style={{ bottom: -6, insetInlineEnd: 8, animationDuration: "8s", animationDelay: "-3s", opacity: 0.9 }}>
        <MeltingCoin size={34} />
      </div>
      <div className="surreal-shape" style={{ top: 10, insetInlineEnd: "38%", animationDuration: "9s", animationDelay: "-4s", opacity: 0.5 }}>
        <CloudBlob size={40} />
      </div>
      <div className="surreal-shape" style={{ bottom: 20, insetInlineStart: 10, animationDuration: "7s", animationDelay: "-2.5s", opacity: 0.4 }}>
        <CloudBlob size={30} color="var(--violet-500)" />
      </div>
    </div>
  );
}
