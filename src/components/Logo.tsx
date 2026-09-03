import { V } from "../data/vocabulary";

/**
 * The mark: a stack of pages behind a checkmark in the app's own "sent" green — the
 * pitch in one shape, a stack of jobs each reported the way a WhatsApp message gets
 * sent. The same mark as the installed home-screen icon, hex-for-hex, so the app never
 * shows a different face from the one someone tapped to open it.
 *
 * Every shape sits inside an 80%-diameter safe circle centered on the 100x100 canvas —
 * the standard maskable-icon safe zone. That constraint belongs here, in the one
 * definition, not re-derived by eye at each call site: the installed icon and this
 * on-screen mark share the exact same risk of getting clipped by whatever shape a
 * launcher or a browser tab decides to mask it into.
 */
export function Logo({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={V.appName}>
      <defs>
        <filter id="logo-stack-shadow" x="-50%" y="-50%" width="220%" height="220%">
          <feDropShadow dx="0" dy="1.1" stdDeviation="1.06" floodColor="#03231e" floodOpacity="0.4" />
        </filter>
      </defs>
      <rect x="24.1" y="30.6" width="47" height="47" rx="13" fill="#5fcab3" stroke="#0a6f61" strokeWidth="0.4" filter="url(#logo-stack-shadow)" />
      <rect x="25.7" y="28.1" width="47" height="47" rx="13" fill="#39b39c" stroke="#0a6f61" strokeWidth="0.4" filter="url(#logo-stack-shadow)" />
      <rect x="27.3" y="25.7" width="47" height="47" rx="13" fill="#128c7e" stroke="#0a6f61" strokeWidth="0.4" filter="url(#logo-stack-shadow)" />
      <rect x="28.9" y="22.5" width="47" height="47" rx="13" fill="#075e54" filter="url(#logo-stack-shadow)" />
      <path d="M40.3 48.4 L49.2 57.3 L67 37" stroke="#ffffff" strokeWidth="9.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M40.3 48.4 L49.2 57.3 L67 37" stroke="#25d366" strokeWidth="5.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
