import type { ReactNode } from "react";
import type { TaskItem } from "../data/types";
import { categoryIcon, categoryTileColor, Money } from "./UI";

const statusLabel: Record<TaskItem["status"], string> = {
  available: "זמינה",
  in_progress: "בביצוע",
  pending_approval: "ממתינה לאישור",
  completed: "בוצעה 🎉",
};

export interface MissionTrailItem {
  task: TaskItem;
  actionLabel?: string;
  onAction?: () => void;
  extra?: ReactNode;
}

/**
 * Tasks as straight, aligned rows — a leading category orb, title, status + reward,
 * and a trailing action — the exact same row layout as the transactions and other
 * lists so every screen's rows line up identically. Each card cycles the shared
 * --tint palette by position for the app-wide color festival; the orb pulses while
 * a task is in progress / awaiting approval and gets a check once completed.
 */
export function MissionTrail({ items }: { items: MissionTrailItem[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "10px 20px 4px" }}>
      {items.map(({ task, actionLabel, onAction, extra }, i) => {
        const color = categoryTileColor(task.category);
        const isPulse = task.status === "in_progress" || task.status === "pending_approval";
        const isDone = task.status === "completed";
        return (
          <div
            key={task.id}
            className="glass"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: "var(--radius-sm)",
              boxShadow: "var(--shadow-card)",
              background: `var(--tint-${(i % 5) + 1})`,
            }}
          >
            <div
              className={isPulse ? "orb-pulse" : undefined}
              style={{
                position: "relative",
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: "54% 46% 50% 50% / 50% 50% 54% 46%",
                background: color,
                boxShadow: `0 8px 16px -6px ${color}`,
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {categoryIcon(task.category)}
              {isDone && (
                <span
                  style={{
                    position: "absolute",
                    bottom: -2,
                    insetInlineEnd: -2,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    color: "var(--teal-900)",
                    fontWeight: 800,
                    boxShadow: "0 2px 6px rgba(23,24,31,0.25)",
                  }}
                >
                  ✓
                </span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                <span>{statusLabel[task.status]}</span>
                <span>·</span>
                <Money value={task.reward} />
              </div>
              {extra}
            </div>
            {actionLabel && onAction && (
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
      })}
    </div>
  );
}
