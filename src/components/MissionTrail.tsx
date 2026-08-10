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
 * A winding constellation of mission "orbs" replacing a flat task list —
 * each task floats along an alternating dashed trail instead of sitting in a
 * stacked row, echoing the recommended-tasks path already used on the parent home.
 */
export function MissionTrail({ items }: { items: MissionTrailItem[] }) {
  return (
    <div style={{ position: "relative", padding: "10px 20px 4px" }}>
      <div
        aria-hidden="true"
        style={{ position: "absolute", top: 10, bottom: 26, insetInlineStart: "50%", borderInlineStart: "3px dashed var(--line)" }}
      />
      {items.map(({ task, actionLabel, onAction, extra }, i) => {
        const leftSide = i % 2 === 0;
        const color = categoryTileColor(task.category);
        const isPulse = task.status === "in_progress" || task.status === "pending_approval";
        const isDone = task.status === "completed";
        const isAvailable = task.status === "available";
        return (
          <div key={task.id} style={{ marginBottom: 22 }}>
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: leftSide ? "row" : "row-reverse", alignItems: "center", gap: 12 }}>
              <div
                className={isPulse ? "orb-pulse" : undefined}
                style={{
                  position: "relative",
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: isAvailable ? "var(--line-soft)" : color,
                  border: isAvailable ? "2px dashed var(--line)" : "none",
                  color: isAvailable ? "var(--ink-faint)" : "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isAvailable ? "none" : "var(--shadow-card-solid)",
                  flexShrink: 0,
                }}
              >
                {categoryIcon(task.category)}
                {isDone && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: -2,
                      insetInlineEnd: -2,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      color: "var(--teal-900)",
                      fontWeight: 800,
                      boxShadow: "0 2px 6px rgba(23,24,31,0.25)",
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
              <div
                className="glass"
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: "10px 14px",
                  borderRadius: leftSide ? "6px 22px 22px 22px" : "22px 6px 22px 22px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{statusLabel[task.status]}</span>
                      <span>·</span>
                      <Money value={task.reward} />
                    </div>
                  </div>
                  {actionLabel && onAction && (
                    <button
                      onClick={onAction}
                      style={{
                        background: "var(--teal-700)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 999,
                        padding: "8px 13px",
                        fontSize: 11.5,
                        fontWeight: 800,
                        boxShadow: "var(--glow-teal)",
                        flexShrink: 0,
                      }}
                    >
                      {actionLabel}
                    </button>
                  )}
                </div>
                {extra}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
