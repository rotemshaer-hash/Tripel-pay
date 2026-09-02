/**
 * The product's whole user-facing vocabulary in one place.
 *
 * The underlying mechanics — assign work, do it, submit evidence, approve, log it —
 * are identical whether the pair is parent/child or manager/employee. Keeping every
 * label here means the same codebase serves both markets, and switching verticals is
 * a one-line change instead of a rewrite. Screens must read labels from here rather
 * than hardcoding Hebrew strings.
 */

/**
 * The business build's state palette. Every screen reads its colours from here, so
 * "waiting on the manager" cannot be indigo in the task list and purple in the
 * journal — a reader learns one colour per meaning and it holds everywhere.
 */
export const work = {
  /** The product's ink: active tabs, primary buttons, headers. */
  ink: "#111b21",
  /** Something is wrong or is being undone: overdue, rejected, stopped, destructive. */
  alert: "#b0281c",
  /** Finished and accepted. */
  done: "#157f45",
  /** Waiting on somebody. */
  waiting: "#8a6410",
  /** In motion. */
  active: "#128c7e",
  /** Not started / neutral. */
  idle: "#667781",
  /**
   * The one colour that exists to be pressed, on the dark bar.
   *
   * Every other colour here means a state, so a primary action cannot borrow one
   * without claiming to be that state. Gold is not a state in this product, it holds
   * up against the slate, and it does not collide with the white role chip or the red
   * text already sitting in that bar.
   */
  action: "#25d366",
  /** The identity accent on a dark ground — the product name on the splash, the
   * company name in the title bar. Light enough to read on the slate, and quiet
   * enough not to compete with `action`, which is the only thing there to press. */
  onDark: "#a7d7cf",
} as const;

export type ProductMode = "work" | "family";

/** The vertical this build ships as. */
export const MODE: ProductMode = "work";

interface Vocabulary {
  /** The product's name. It differs by vertical, so it lives here with everything
   * else that does — never written out in a screen. */
  appName: string;
  admin: string;
  adminPlural: string;
  worker: string;
  workerPlural: string;
  task: string;
  taskPlural: string;
  taskBank: string;
  journal: string;
  rules: string;
  training: string;
  achievements: string;
  reward: string;
  rewardBalance: string;
  rewardCatalogue: string;
  goal: string;
  brief: string;
  proof: string;
  site: string;
}

const WORK: Vocabulary = {
  appName: "Work It",
  admin: "מנהל",
  adminPlural: "מנהלים",
  worker: "עובד",
  workerPlural: "עובדים",
  task: "משימה",
  taskPlural: "משימות",
  taskBank: "תבניות משימות",
  journal: "יומן עבודה",
  rules: "נהלי העבודה",
  training: "הדרכות",
  achievements: "ביצועים",
  reward: "תמריץ",
  rewardBalance: "יתרת תמריצים",
  rewardCatalogue: "קטלוג תגמולים",
  goal: "יעד",
  brief: "פירוט המשימה",
  proof: "אסמכתאות",
  site: "לקוח / אתר",
};

const FAMILY: Vocabulary = {
  appName: "Triple Pay",
  admin: "הורה",
  adminPlural: "הורים",
  worker: "ילד",
  workerPlural: "ילדים",
  task: "מטלה",
  taskPlural: "מטלות",
  taskBank: "מאגר מטלות",
  journal: "יומן",
  rules: "כללי הבית",
  training: "הידע שלי",
  achievements: "הישגים",
  reward: "תגמול",
  rewardBalance: "הארנק שלי",
  rewardCatalogue: "מאגר המתנות",
  goal: "מטרת חיסכון",
  brief: "פירוט",
  proof: "הוכחה",
  site: "קטגוריה",
};

export const V: Vocabulary = MODE === "work" ? WORK : FAMILY;

export const priorityLabels: Record<string, string> = {
  low: "נמוכה",
  normal: "רגילה",
  high: "גבוהה",
  urgent: "דחוף",
};

export const priorityColor: Record<string, string> = {
  low: work.idle,
  normal: "#2f7fd1",
  high: work.active,
  urgent: work.alert,
};

/** Hebrew wording for each audit-trail action — shared by the journal feed and the
 * per-task trail so one entry never reads differently in two places. */
export const activityLabels: Record<string, string> = {
  created: "נוצרה",
  assigned: "הוקצתה",
  started: "התחילו לבצע",
  submitted: "הוגשה לאישור",
  approved: "אושרה",
  reopened: "הוחזרה לתיקון",
  commented: "הערה",
  attached: "צורף קובץ",
  edited: "עודכנה",
  reassigned: "הועברה",
  sent: "נשלחה בוואטסאפ",
  seen: "נצפתה",
  acknowledged: "אושרה קבלה",
  archived: "הוסרה מלוח המשימות",
  restored: "שוחזרה ללוח המשימות",
};

/** How a task's state reads and colours everywhere it's shown — the list, the detail
 * header and the journal all take it from here, so a status never reads one way on
 * one screen and another way on the next. */
export const taskStatusLabels: Record<string, string> = {
  available: "טרם התחילה",
  in_progress: "בביצוע",
  pending_approval: "ממתינה לאישור",
  completed: "אושרה",
};


/**
 * Which of the four status pills a job wears.
 *
 * The colours themselves live in the stylesheet, once. Screens that mixed their own
 * from a hex plus an alpha suffix are how a design system quietly becomes forty
 * slightly different chips, so the decision is made here and every screen asks.
 */
export function statusPillClass(status: string, late = false): string {
  if (status === "completed") return "pill pill-done";
  if (late) return "pill pill-late";
  if (status === "pending_approval") return "pill pill-wait";
  return "pill";
}

export const taskStatusColor: Record<string, string> = {
  available: work.idle,
  in_progress: work.active,
  pending_approval: work.waiting,
  completed: work.done,
};

export const recurrenceLabels: Record<string, string> = {
  none: "חד־פעמית",
  daily: "יומית",
  weekly: "שבועית",
  monthly: "חודשית",
};
