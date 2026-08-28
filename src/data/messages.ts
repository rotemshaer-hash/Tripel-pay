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


/** Telling someone a job changed after they were already sent it. Names what moved,
 * because "עודכנה המשימה" makes a person open the link to look for a difference. */
export function updateMessage(company: string, worker: Child, task: TaskItem, changed: string[]): string {
  return [
    `${worker.name}, עדכון ב${company}:`,
    `• ${task.title}`,
    changed.length > 0 ? `מה השתנה: ${changed.join(", ")}` : "",
    task.dueAt ? `יעד: ${formatDate(task.dueAt)}` : "",
    "",
    "הפרטים המעודכנים בקישור שלך:",
    worker.dayToken ? workerDayLink(worker.dayToken) : "",
  ]
    .filter(Boolean)
    .join("\n");
}


/** A job just written, sent the moment it exists. Leads with the new task, and carries
 * the person's one link — the same link they already know, not a second one. */
export function newTaskMessage(company: string, worker: Child, task: TaskItem): string {
  const others = worker.tasks.filter((t) => t.id !== task.id && t.status !== "completed");
  return [
    `${worker.name}, משימה חדשה מ${company}:`,
    `• ${task.title}${task.dueAt ? ` (יעד: ${formatDate(task.dueAt)})` : ""}${task.site ? ` — ${task.site}` : ""}`,
    task.brief ? task.brief : "",
    others.length > 0 ? `\nיש לך עוד ${others.length} משימות פתוחות ברשימה.` : "",
    "",
    "אישור קבלה, התחלה, סיום, תמונה או הערה — הכל בקישור שלך, בלי להתקין כלום:",
    worker.dayToken ? workerDayLink(worker.dayToken) : "",
  ]
    .filter(Boolean)
    .join("\n");
}
