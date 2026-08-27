import type { Child, TaskItem } from "./types";
import { workerDayLink } from "./routes";
import { formatDate } from "../utils/datetime";

/**
 * What actually gets sent to a person, with one definition.
 *
 * The message IS the product's surface for the worker — it is the only part of this
 * app most of them will ever read — so it cannot be assembled slightly differently on
 * each screen that offers to send it.
 */
export function dayMessage(company: string, worker: Child): string {
  const open = worker.tasks.filter((t) => t.status !== "completed");
  if (open.length === 0) return `${worker.name}, אין לך משימות פתוחות כרגע.`;
  const lines = open.map((t) => `• ${t.title}${t.dueAt ? ` (יעד: ${formatDate(t.dueAt)})` : ""}${t.site ? ` — ${t.site}` : ""}`);
  return [
    `היי ${worker.name}, המשימות שלך מ${company}:`,
    ...lines,
    "",
    "אישור קבלה, התחלה, סיום, תמונה או הערה — הכל בקישור הזה, בלי להתקין כלום:",
    worker.dayToken ? workerDayLink(worker.dayToken) : "",
  ]
    .filter(Boolean)
    .join("\n");
}


/** A reminder about one job, when it has gone quiet. Deliberately short and specific:
 * a nudge that repeats the whole day's list reads as nagging, and gets ignored. */
export function nudgeMessage(company: string, worker: Child, task: TaskItem): string {
  return [
    `${worker.name}, תזכורת מ${company}:`,
    `• ${task.title}${task.dueAt ? ` (יעד: ${formatDate(task.dueAt)})` : ""}${task.site ? ` — ${task.site}` : ""}`,
    "",
    "אפשר לאשר קבלה ולעדכן כאן:",
    worker.dayToken ? workerDayLink(worker.dayToken) : "",
  ]
    .filter(Boolean)
    .join("\n");
}
