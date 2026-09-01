import { useState } from "react";
import { work } from "../data/vocabulary";

/**
 * "Are you sure" without the popup.
 *
 * `window.confirm` blocks the page behind a browser chrome dialog that, on a phone,
 * announces the site's domain and offers two flat buttons with no room for the one
 * thing that matters — what is about to be destroyed. It reads as the browser
 * interrupting, not as the app asking, and the report was simply that it jumps out.
 *
 * The question is asked in place instead: the button becomes the warning, with the
 * confirm and the way out side by side under it. Same protection, and now there is
 * space to say what goes, which is the part that actually makes a destructive action
 * safe. One definition, because a second one would drift.
 */
export function ConfirmButton({
  label,
  warning,
  confirmLabel = "כן, למחוק",
  onConfirm,
  className,
  style,
  compact,
}: {
  label: string;
  /** What is about to be destroyed, in the reader's terms. */
  warning: string;
  confirmLabel?: string;
  onConfirm: () => void;
  className?: string;
  style?: React.CSSProperties;
  /** For a delete that lives as an icon inside a row, where a panel has nowhere to
   * open. The button arms itself and says so; the second press is the confirmation.
   * A row's × still must not delete on one accidental tap. */
  compact?: boolean;
}) {
  const [armed, setArmed] = useState(false);

  if (armed && compact) {
    return (
      <button
        type="button"
        className={className}
        style={{ ...style, background: work.alert, color: "#ffffff", borderRadius: 8, padding: "4px 9px", fontSize: 11.5, fontWeight: 800 }}
        title={warning}
        onBlur={() => setArmed(false)}
        onClick={() => {
          setArmed(false);
          onConfirm();
        }}
      >
        {confirmLabel}
      </button>
    );
  }

  if (!armed) {
    return (
      <button type="button" className={className} style={style} onClick={() => setArmed(true)}>
        {label}
      </button>
    );
  }

  return (
    <div
      style={{
        background: "var(--alert-bg)",
        border: `1px solid ${work.alert}`,
        borderRadius: 12,
        padding: "12px 13px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ fontSize: 12.5, color: work.alert, lineHeight: 1.6, fontWeight: 700 }}>{warning}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => {
            setArmed(false);
            onConfirm();
          }}
          style={{
            flex: 1,
            background: work.alert,
            color: "#ffffff",
            border: "none",
            borderRadius: 10,
            padding: "12px",
            fontSize: 13.5,
            fontWeight: 800,
          }}
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={() => setArmed(false)}
          style={{
            flex: 1,
            background: "var(--card)",
            color: "var(--ink)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "12px",
            fontSize: 13.5,
            fontWeight: 700,
          }}
        >
          ביטול
        </button>
      </div>
    </div>
  );
}
