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
