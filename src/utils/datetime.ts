/**
 * Date helpers for the work journal.
 *
 * Records written before timestamps existed carry a literal Hebrew string
 * (e.g. "היום") in their date field. Every formatter here passes such a value
 * through untouched, so old data keeps rendering while new data gets real dates.
 */

const HE = "he-IL";

/** True when the value is a real timestamp rather than a legacy label. */
export function isTimestamp(value: string | undefined): boolean {
  if (!value) return false;
  return !Number.isNaN(Date.parse(value));
}

export function toDate(value: string | undefined): Date | null {
  if (!isTimestamp(value)) return null;
  return new Date(value as string);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** "היום" / "אתמול" / "12.08.26" — falls back to the raw label for legacy rows. */
export function formatDate(value: string | undefined): string {
  const d = toDate(value);
  if (!d) return value ?? "";
  const days = Math.round((startOfDay(new Date()).getTime() - startOfDay(d).getTime()) / 86400000);
  if (days === 0) return "היום";
  if (days === 1) return "אתמול";
  return d.toLocaleDateString(HE, { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export function formatTime(value: string | undefined): string {
  const d = toDate(value);
  if (!d) return "";
  return d.toLocaleTimeString(HE, { hour: "2-digit", minute: "2-digit" });
}

/** "היום 14:32" — the audit-trail stamp. */
export function formatDateTime(value: string | undefined): string {
  const d = toDate(value);
  if (!d) return value ?? "";
  return `${formatDate(value)} ${formatTime(value)}`;
}

export type JournalRange = "day" | "week" | "month";

export const rangeLabels: Record<JournalRange, string> = {
  day: "יומי",
  week: "שבועי",
  month: "חודשי",
};

/** Inclusive start of the given range, counting back from `now`. */
export function rangeStart(range: JournalRange, now = new Date()): Date {
  const start = startOfDay(now);
  if (range === "day") return start;
  if (range === "week") {
    // Israeli week starts on Sunday (getDay() === 0).
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() - start.getDay());
  }
  return new Date(start.getFullYear(), start.getMonth(), 1);
}

export function withinRange(value: string | undefined, range: JournalRange, now = new Date()): boolean {
  const d = toDate(value);
  if (!d) return false;
  return d.getTime() >= rangeStart(range, now).getTime();
}

/** Overdue = has a due date, it has passed, and the work isn't approved yet. */
export function isOverdue(dueAt: string | undefined, status: string): boolean {
  const d = toDate(dueAt);
  if (!d || status === "completed") return false;
  return d.getTime() < Date.now();
}

/** End of the given day — the moment an occurrence due "today" stops being in the future. */
export function endOfDay(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/**
 * The due date of the occurrence that follows `from` under a repeat rule.
 *
 * Monthly steps keep the day-of-month and clamp to the month's length, so a job due
 * on the 31st recurs on the 30th of a 30-day month and on the 28th of February —
 * without silently drifting into the following month the way a naive +1 month does.
 */
export function nextDueDate(from: Date, rule: "daily" | "weekly" | "monthly"): Date {
  if (rule === "daily") return new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1, from.getHours(), from.getMinutes(), from.getSeconds());
  if (rule === "weekly") return new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7, from.getHours(), from.getMinutes(), from.getSeconds());
  const targetMonth = from.getMonth() + 1;
  const lastDay = new Date(from.getFullYear(), targetMonth + 1, 0).getDate();
  return new Date(from.getFullYear(), targetMonth, Math.min(from.getDate(), lastDay), from.getHours(), from.getMinutes(), from.getSeconds());
}
