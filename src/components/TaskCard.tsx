import type { TaskItem } from "../data/types";
import { CategoryIconChip, Money } from "./UI";

const statusLabel: Record<TaskItem["status"], string> = {
  available: "זמינה",
  in_progress: "בביצוע",
  pending_approval: "ממתינה לאישור",
  completed: "כל הכבוד! בוצעה 🎉",
};

const statusBg: Record<TaskItem["status"], string> = {
  available: "var(--line-soft)",
  in_progress: "var(--amber-100)",
  pending_approval: "var(--violet-200)",
  completed: "var(--teal-100)",
};

const statusText: Record<TaskItem["status"], string> = {
  available: "var(--ink-soft)",
  in_progress: "#8a5c00",
  pending_approval: "var(--violet-700)",
  completed: "var(--teal-900)",
};

export function TaskCard({
  task,
  actionLabel,
  onAction,
}: {
  task: TaskItem;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      className="glass"
      style={{
        borderRadius: "var(--radius-sm)",
        padding: "13px 15px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <CategoryIconChip cat={task.category} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
          <span
            style={{
              fontSize: 10.5,
              color: statusText[task.status],
              background: statusBg[task.status],
              fontWeight: 800,
              padding: "3px 9px",
              borderRadius: 999,
              letterSpacing: "0.01em",
            }}
          >
            {statusLabel[task.status]}
          </span>
          <span style={{ fontSize: 12, color: "var(--ink-faint)" }}><Money value={task.reward} /></span>
        </div>
      </div>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          style={{
            background: "var(--teal-700)",
            color: "#ffffff",
            border: "none",
            borderRadius: 999,
            padding: "9px 15px",
            fontSize: 12.5,
            fontWeight: 800,
            boxShadow: "var(--glow-teal)",
            flexShrink: 0,
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
