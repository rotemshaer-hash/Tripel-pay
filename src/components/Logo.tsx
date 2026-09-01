import { V } from "../data/vocabulary";

/**
 * The mark: a message bubble holding a checkmark in the app's own "sent" green —
 * the pitch in one shape, a job reported the way a WhatsApp message gets sent. Teal
 * for the bubble rather than WhatsApp's own green keeps it a wink at WhatsApp, not a
 * copy of its icon.
 */
export function Logo({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" role="img" aria-label={V.appName}>
      <path
        d="M23 4c11.05 0 20 8.06 20 18s-8.95 18-20 18c-2.55 0-4.98-.43-7.22-1.22L6 42l3.1-8.9C6.9 30.1 6 27.2 6 24 6 12.06 12.95 4 23 4z"
        fill="var(--accent)"
      />
      <path d="M14 22l5.5 6L33 14" stroke="var(--send)" strokeWidth="4.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
