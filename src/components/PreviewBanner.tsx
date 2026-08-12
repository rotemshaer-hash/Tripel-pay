/**
 * Shown at the top of child screens when a parent is previewing them — makes it clear
 * the parent is only viewing what the child sees and can't act on the child's behalf.
 */
export function PreviewBanner({ childName }: { childName: string }) {
  return (
    <div style={{ padding: "12px 20px 0" }}>
      <div
        className="glass"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderRadius: "var(--radius-sm)",
          padding: "10px 14px",
          fontSize: 12.5,
          fontWeight: 700,
          color: "var(--ink-soft)",
        }}
      >
        <span style={{ fontSize: 16 }}>👁️</span>
        <span style={{ flex: 1 }}>תצוגת הורה — כך {childName} רואה את המסך. הפעולות זמינות ל{childName} בלבד.</span>
      </div>
    </div>
  );
}
