import { createContext, useContext, useEffect, useMemo, useRef, useReducer, type ReactNode } from "react";
import { seedFamily, templateChild } from "./seed";
import { childrenList, normalizeFamily } from "./family";
import { endOfDay, nextDueDate, toDate } from "../utils/datetime";
import type { ActivityEntry, Attachment, ChecklistItem, Child, ChildSettings, CompanyDoc, Supplier, ExtraCard, Family, GiftBankItem, HouseRule, SavingsGoal, TaskCategory, TaskItem, TaskPriority, TaskTemplate } from "./types";
import {
  onAuthChange,
  registerParent,
  loginParent,
  logoutParent,
  fetchFamily,
  registerChild,
  loginChild,
  fetchChildLink,
  registerSecondParent,
  fetchParentLink,
  resetParentPassword,
  deleteOwnAccount,
} from "../firebase/auth";
import { auth } from "../firebase/config";
import { uploadFile as uploadToStorage, deleteStoredFile, describeUploadError, MAX_UPLOAD_BYTES, type StoredFile } from "../firebase/storage";
import { subscribeFamily, saveFamily, saveChildOnly } from "../firebase/db";

type ViewMode = "parent" | "child";
type Role = "parent" | "child";

interface AppState {
  onboarded: boolean;
  family: Family;
  activeChildId: string;
  viewMode: ViewMode;
  role: Role;
  uid: string | null;
  familyUid: string | null;
}

type Action =
  | { type: "HYDRATE"; uid: string; familyUid: string; role: Role; family: Family; forcedChildId?: string }
  | { type: "SIGN_OUT" }
  | { type: "SET_ACTIVE_CHILD"; childId: string }
  | { type: "SET_VIEW_MODE"; mode: ViewMode }
  | { type: "SET_CHILD_PHOTO"; childId: string; photoUrl: string | null }
  | { type: "COMPLETE_MISSION"; childId: string; articleId: string; articleTitle: string; reward: number }
  | {
      type: "ASSIGN_TASK";
      childId: string;
      templateId: string;
      by?: string;
      at?: string;
      brief?: string;
      dueAt?: string;
      priority?: TaskPriority;
      recurrence?: TaskItem["recurrence"];
      site?: string;
    }
  | {
      type: "CREATE_TASK";
      childId: string;
      title: string;
      brief?: string;
      dueAt?: string;
      priority?: TaskPriority;
      recurrence?: TaskItem["recurrence"];
      site?: string;
      category?: TaskCategory;
      checklist?: ChecklistItem[];
      by?: string;
      at?: string;
    }
  | { type: "ADVANCE_TASK"; childId: string; taskId: string; by?: string; at?: string }
  | { type: "APPROVE_TASK"; childId: string; taskId: string; by?: string; at?: string }
  | { type: "REOPEN_TASK"; childId: string; taskId: string; reason?: string; by?: string; at?: string }
  | { type: "ADD_TASK_ATTACHMENT"; childId: string; taskId: string; target: "brief" | "proof"; kind: Attachment["kind"]; name: string; content: string; path?: string; size?: number; mime?: string; by: string; at?: string }
  | { type: "ADD_TASK_COMMENT"; childId: string; taskId: string; text: string; by: string; at?: string }
  | { type: "REDEEM_GIFT"; childId: string; giftId: string }
  | { type: "FULFILL_GIFT"; childId: string; redeemedId: string; code: string }
  | { type: "SEND_MONEY"; childId: string; amount: number; note: string }
  | { type: "ACCRUE_ALLOWANCES"; now: number }
  | { type: "WITHDRAW_CASH"; childId: string; amount: number; note: string }
  | { type: "CONTRIBUTE_SAVINGS"; childId: string; goalId: string; amount: number }
  | { type: "ADD_SAVINGS_GOAL"; childId: string; goal: SavingsGoal }
  | { type: "UPDATE_SETTINGS"; childId: string; patch: Partial<ChildSettings> }
  | { type: "ADD_AUTHORIZED_PERSON"; childId: string; name: string; relation: string }
  | { type: "ROLL_RECURRING_TASKS"; now: number }
  | { type: "STOP_TASK_SERIES"; childId: string; taskId: string; by?: string; at?: string }
  | { type: "RESUME_TASK_SERIES"; childId: string; taskId: string; by?: string; at?: string }
  | { type: "TOGGLE_CHECKLIST_ITEM"; childId: string; taskId: string; itemId: string; by?: string; at?: string }
  | { type: "ADD_SUPPLIER"; name: string; phone: string; category?: string; email?: string; note?: string; at?: string }
  | { type: "UPDATE_SUPPLIER"; supplierId: string; name: string; phone: string; category?: string; email?: string; note?: string }
  | { type: "REMOVE_SUPPLIER"; supplierId: string }
  | { type: "ADD_DOCUMENT"; title: string; kind: CompanyDoc["kind"]; content: string; path?: string; size?: number; mime?: string; note?: string; by: string; at?: string }
  | { type: "REMOVE_DOCUMENT"; docId: string }
  | { type: "ADD_WORKER"; name: string }
  | { type: "ADD_HOUSE_RULE"; text: string }
  | { type: "REMOVE_HOUSE_RULE"; ruleId: string }
  | { type: "RESET_CHILD_PROGRESS"; childId: string }
  | { type: "ADD_EXTRA_CARD"; childId: string; name: string; category: ExtraCard["category"]; cost?: number; note?: string }
  | { type: "REMOVE_EXTRA_CARD"; childId: string; cardId: string }
  | { type: "ADD_TASK_TEMPLATE"; title: string; reward: number; category: TaskCategory }
  | { type: "UPDATE_TASK_TEMPLATE"; templateId: string; title: string; reward: number; category: TaskCategory }
  | { type: "REMOVE_TASK_TEMPLATE"; templateId: string }
  | { type: "ADD_GIFT"; title: string; cost: number; category: GiftBankItem["category"] }
  | { type: "REMOVE_GIFT"; giftId: string }
  | { type: "REVEAL_TASK_REWARD"; childId: string; taskId: string }
  | { type: "OFFER_TASK_TRADE"; childId: string; taskId: string; toChildId: string }
  | { type: "CANCEL_TASK_TRADE"; childId: string; taskId: string }
  | { type: "APPROVE_TASK_TRADE"; fromChildId: string; taskId: string };

const STORAGE_KEY = "triple-pay-state-v1";

function isValidState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<AppState>;
  return (
    typeof v.onboarded === "boolean" &&
    typeof v.activeChildId === "string" &&
    (v.viewMode === "parent" || v.viewMode === "child") &&
    (v.role === "parent" || v.role === "child") &&
    !!v.family &&
    !!v.family.children &&
    typeof v.family.children === "object" &&
    !Array.isArray(v.family.children) &&
    Array.isArray(v.family.childOrder) &&
    Array.isArray(v.family.taskBank) &&
    Array.isArray(v.family.giftBank)
  );
}

function freshState(): AppState {
  const family = seedFamily("", "");
  return {
    onboarded: false,
    family,
    activeChildId: family.childOrder[0] ?? "",
    viewMode: "parent",
    role: "parent",
    uid: null,
    familyUid: null,
  };
}

function loadInitial(): AppState {
  // This is only a paint-time cache so returning users don't flash the splash
  // screen while Firebase resolves auth state — the auth listener below is the
  // real source of truth and will correct this immediately either way.
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValidState(parsed)) return { ...parsed, uid: null, family: normalizeFamily(parsed.family) };
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* corrupt storage — fall through to a fresh seed */
  }
  return freshState();
}

function mapChild(family: Family, childId: string, fn: (c: Child) => Child): Family {
  const existing = family.children[childId];
  if (!existing) return family;
  return { ...family, children: { ...family.children, [childId]: fn(existing) } };
}

/** Append one line to a task's audit trail. Entries are only ever added — the trail is
 * the record that replaces "but I told you on WhatsApp", so nothing rewrites history. */
function logActivity(task: TaskItem, entry: Omit<ActivityEntry, "id" | "at">, at: string): TaskItem {
  return {
    ...task,
    activity: [...(task.activity ?? []), { id: `ac-${crypto.randomUUID()}`, at, ...entry }],
  };
}

/** Applies a single task update inside a child, keeping the rest untouched. */
function mapTask(c: Child, taskId: string, fn: (t: TaskItem) => TaskItem): Child {
  return { ...c, tasks: c.tasks.map((t) => (t.id === taskId ? fn(t) : t)) };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "HYDRATE": {
      const list = childrenList(action.family);
      const activeChildId =
        action.role === "child"
          ? action.forcedChildId ?? list[0]?.id ?? state.activeChildId
          : list.some((c) => c.id === state.activeChildId)
            ? state.activeChildId
            : (list[0]?.id ?? state.activeChildId);
      return {
        ...state,
        onboarded: true,
        uid: action.uid,
        familyUid: action.familyUid,
        role: action.role,
        viewMode: action.role === "child" ? "child" : state.viewMode,
        family: action.family,
        activeChildId,
      };
    }
    case "SIGN_OUT":
      return freshState();
    case "SET_ACTIVE_CHILD":
      if (state.role === "child") return state; // a child session is locked to its own id
      return { ...state, activeChildId: action.childId };
    case "SET_VIEW_MODE":
      if (state.role === "child") return state; // no parent view to switch to on a real child login
      return { ...state, viewMode: action.mode };
    case "SET_CHILD_PHOTO":
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => ({ ...c, photoUrl: action.photoUrl ?? undefined })),
      };
    case "COMPLETE_MISSION":
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => {
          if (c.readArticles.includes(action.articleId)) return c;
          return {
            ...c,
            balance: c.balance + action.reward,
            readArticles: [...c.readArticles, action.articleId],
            transactions: [
              { id: `tx-${crypto.randomUUID()}`, title: `השלמת משימה: ${action.articleTitle}`, amount: action.reward, date: "היום" },
              ...c.transactions,
            ],
          };
        }),
      };
    case "ASSIGN_TASK": {
      const template = state.family.taskBank.find((t) => t.id === action.templateId);
      if (!template) return state;
      const at = action.at ?? new Date().toISOString();
      const newTask: TaskItem = logActivity(
        {
          id: `t-${crypto.randomUUID()}`,
          title: template.title,
          reward: template.reward,
          category: template.category,
          status: "available",
          createdAt: at,
          brief: action.brief,
          dueAt: action.dueAt,
          priority: action.priority ?? "normal",
          recurrence: action.recurrence ?? "none",
          site: action.site,
          activity: [],
        },
        { by: action.by ?? "", action: "assigned", detail: action.dueAt ? `יעד: ${action.dueAt.slice(0, 10)}` : undefined },
        at
      );
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => ({ ...c, tasks: [newTask, ...c.tasks] })),
      };
    }
    case "CREATE_TASK": {
      // A free-form task written by the manager, with no template behind it.
      const at = action.at ?? new Date().toISOString();
      const id = `t-${crypto.randomUUID()}`;
      const repeats = (action.recurrence ?? "none") !== "none";
      const task: TaskItem = logActivity(
        {
          id,
          title: action.title,
          reward: 0,
          category: action.category ?? "other",
          status: "available",
          createdAt: at,
          brief: action.brief,
          dueAt: action.dueAt,
          priority: action.priority ?? "normal",
          recurrence: action.recurrence ?? "none",
          site: action.site,
          // A repeating job opens a series named after its first occurrence; every
          // occurrence the engine generates later carries the same id.
          ...(repeats ? { seriesId: id } : {}),
          checklist: action.checklist ?? [],
          activity: [],
        },
        { by: action.by ?? "", action: "assigned", detail: action.dueAt ? `יעד: ${action.dueAt.slice(0, 10)}` : undefined },
        at
      );
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => ({ ...c, tasks: [task, ...c.tasks] })),
      };
    }
    case "ADVANCE_TASK": {
      const at = action.at ?? new Date().toISOString();
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) =>
          mapTask(c, action.taskId, (t) => {
            if (t.status === "available") return logActivity({ ...t, status: "in_progress", startedAt: at }, { by: action.by ?? "", action: "started" }, at);
            if (t.status === "in_progress") return logActivity({ ...t, status: "pending_approval", submittedAt: at }, { by: action.by ?? "", action: "submitted" }, at);
            return t;
          })
        ),
      };
    }
    case "APPROVE_TASK": {
      const at = action.at ?? new Date().toISOString();
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => {
          const task = c.tasks.find((t) => t.id === action.taskId);
          if (!task) return c;
          const approved = mapTask(c, action.taskId, (t) =>
            logActivity({ ...t, status: "completed", approvedAt: at, rewardRevealed: false }, { by: action.by ?? "", action: "approved" }, at)
          );
          return {
            ...approved,
            balance: c.balance + task.reward,
            transactions: [{ id: `tx-${crypto.randomUUID()}`, title: task.title, amount: task.reward, date: at }, ...c.transactions],
            achievements: {
              ...c.achievements,
              tasksCompletedCount: c.achievements.tasksCompletedCount + 1,
            },
          };
        }),
      };
    }
    case "REOPEN_TASK": {
      // The manager sends work back: status returns to in-progress and the rejection
      // (with its reason) stays permanently in the trail.
      const at = action.at ?? new Date().toISOString();
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) =>
          mapTask(c, action.taskId, (t) => logActivity({ ...t, status: "in_progress" }, { by: action.by ?? "", action: "reopened", detail: action.reason }, at))
        ),
      };
    }
    case "ADD_TASK_ATTACHMENT": {
      const at = action.at ?? new Date().toISOString();
      const att: Attachment = {
        id: `at-${crypto.randomUUID()}`,
        kind: action.kind,
        name: action.name,
        content: action.content,
        addedAt: at,
        addedBy: action.by,
        // Firebase's set() rejects undefined, so absent metadata is an absent key.
        ...(action.path ? { path: action.path } : {}),
        ...(action.size !== undefined ? { size: action.size } : {}),
        ...(action.mime ? { mime: action.mime } : {}),
      };
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) =>
          mapTask(c, action.taskId, (t) =>
            logActivity(
              action.target === "proof"
                ? { ...t, proofs: [...(t.proofs ?? []), att] }
                : { ...t, briefAttachments: [...(t.briefAttachments ?? []), att] },
              { by: action.by, action: "attached", detail: action.name },
              at
            )
          )
        ),
      };
    }
    case "ADD_TASK_COMMENT": {
      const at = action.at ?? new Date().toISOString();
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) =>
          mapTask(c, action.taskId, (t) =>
            logActivity(
              { ...t, comments: [...(t.comments ?? []), { id: `cm-${crypto.randomUUID()}`, at, by: action.by, text: action.text }] },
              { by: action.by, action: "commented" },
              at
            )
          )
        ),
      };
    }
    case "REDEEM_GIFT": {
      const gift = state.family.giftBank.find((g) => g.id === action.giftId);
      if (!gift) return state;
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => {
          if (c.balance < gift.cost) return c;
          return {
            ...c,
            balance: c.balance - gift.cost,
            transactions: [{ id: `tx-${crypto.randomUUID()}`, title: gift.title, amount: -gift.cost, date: "היום" }, ...c.transactions],
            redeemedGifts: [{ id: `rg-${crypto.randomUUID()}`, title: gift.title, category: gift.category, cost: gift.cost, date: "היום", fulfilled: false }, ...c.redeemedGifts],
          };
        }),
      };
    }
    case "FULFILL_GIFT": {
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => ({
          ...c,
          redeemedGifts: c.redeemedGifts.map((g) => (g.id === action.redeemedId ? { ...g, fulfilled: true, code: action.code } : g)),
        })),
      };
    }
    case "SEND_MONEY": {
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => ({
          ...c,
          balance: c.balance + action.amount,
          transactions: [{ id: `tx-${crypto.randomUUID()}`, title: action.note || "העברה מההורה", amount: action.amount, date: "היום" }, ...c.transactions],
        })),
      };
    }
    case "ACCRUE_ALLOWANCES": {
      // Credit every child whose weekly allowance has come due, computed here from the
      // CURRENT state so a duplicate dispatch (e.g. StrictMode double-invoke) is a safe
      // no-op — the second pass sees the advanced clock and finds nothing due. The first
      // time a child is seen the clock is just stamped (pays nothing) so payments accrue
      // from now; a long gap is capped so it never drops a huge surprise sum.
      const WEEK = 7 * 24 * 60 * 60 * 1000;
      let changed = false;
      const children = { ...state.family.children };
      for (const id of state.family.childOrder) {
        const c = children[id];
        if (!c) continue;
        const weekly = c.settings?.weeklyAllowance ?? 0;
        if (weekly <= 0) continue;
        const last = c.lastAllowancePaidAt ? Date.parse(c.lastAllowancePaidAt) : NaN;
        if (Number.isNaN(last)) {
          children[id] = { ...c, lastAllowancePaidAt: new Date(action.now).toISOString() };
          changed = true;
          continue;
        }
        const weeks = Math.floor((action.now - last) / WEEK);
        if (weeks >= 1) {
          const amount = Math.min(weeks, 8) * weekly;
          children[id] = {
            ...c,
            lastAllowancePaidAt: new Date(last + weeks * WEEK).toISOString(),
            balance: c.balance + amount,
            transactions: [{ id: `tx-${crypto.randomUUID()}`, title: "דמי כיס שבועיים", amount, date: "היום" }, ...c.transactions],
          };
          changed = true;
        }
      }
      if (!changed) return state;
      return { ...state, family: { ...state.family, children } };
    }
    case "WITHDRAW_CASH": {
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => {
          const amount = Math.min(action.amount, c.balance);
          if (amount <= 0) return c;
          return {
            ...c,
            balance: c.balance - amount,
            transactions: [{ id: `tx-${crypto.randomUUID()}`, title: action.note || "משיכה במזומן", amount: -amount, date: "היום" }, ...c.transactions],
          };
        }),
      };
    }
    case "CONTRIBUTE_SAVINGS": {
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => {
          if (c.balance < action.amount) return c;
          return {
            ...c,
            balance: c.balance - action.amount,
            savingsTotal: c.savingsTotal + action.amount,
            savingsGoals: c.savingsGoals.map((g) => (g.id === action.goalId ? { ...g, current: Math.min(g.target, g.current + action.amount) } : g)),
          };
        }),
      };
    }
    case "ADD_SAVINGS_GOAL": {
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => ({ ...c, savingsGoals: [...c.savingsGoals, action.goal] })),
      };
    }
    case "UPDATE_SETTINGS": {
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => ({ ...c, settings: { ...c.settings, ...action.patch } })),
      };
    }
    case "ADD_AUTHORIZED_PERSON": {
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => ({
          ...c,
          settings: {
            ...c.settings,
            authorizedPeople: [...c.settings.authorizedPeople, { id: `ap-${crypto.randomUUID()}`, name: action.name, relation: action.relation }],
          },
        })),
      };
    }
    case "ROLL_RECURRING_TASKS": {
      // Turn repeat rules into real tasks.
      //
      // Every occurrence of a repeating job shares a seriesId, so a series is just the
      // tasks carrying that id. For each one we look at its NEWEST occurrence, step its
      // due date forward by the rule, and create every occurrence that has come due —
      // catching up on a gap (nobody opened the app over the weekend) in one pass.
      //
      // Idempotent by construction: it derives everything from the tasks present in the
      // CURRENT state, so a second dispatch sees the occurrences the first one created
      // and finds nothing left to generate — a StrictMode double-invoke is a no-op.
      const horizon = endOfDay(new Date(action.now)).getTime();
      // A neglected daily job would otherwise pile up an unbounded wall of overdue
      // copies. Cap the open ones: three unfinished occurrences already say "this is
      // being missed", and the trail keeps the full history either way.
      const MAX_OPEN_PER_SERIES = 3;
      // A hard stop on one pass, so a clock jump or a very old record can never spin.
      const MAX_PER_PASS = 60;

      let changed = false;
      const children = { ...state.family.children };

      for (const childId of state.family.childOrder) {
        const child = children[childId];
        if (!child) continue;

        const bySeries = new Map<string, TaskItem[]>();
        for (const t of child.tasks) {
          if (!t.seriesId) continue;
          const list = bySeries.get(t.seriesId);
          if (list) list.push(t);
          else bySeries.set(t.seriesId, [t]);
        }

        const generated: TaskItem[] = [];
        for (const [seriesId, occurrences] of bySeries) {
          const newest = occurrences.reduce((a, b) => ((toDate(b.dueAt)?.getTime() ?? 0) > (toDate(a.dueAt)?.getTime() ?? 0) ? b : a));
          if (newest.seriesStoppedAt) continue;
          const rule = newest.recurrence;
          if (!rule || rule === "none") continue;
          const anchor = toDate(newest.dueAt);
          if (!anchor) continue;

          // Firebase's set() rejects undefined values, so last occurrence's lifecycle
          // stamps are dropped as keys rather than blanked out.
          const { startedAt: _s, submittedAt: _sub, approvedAt: _a, rewardRevealed: _r, seriesStoppedAt: _st, tradeOfferedTo: _tr, ...blueprint } = newest;

          // Every occurrence whose due date has arrived, oldest first...
          const dueDates: Date[] = [];
          let next = nextDueDate(anchor, rule);
          while (next.getTime() <= horizon && dueDates.length < MAX_PER_PASS) {
            dueDates.push(next);
            next = nextDueDate(next, rule);
          }
          const open = occurrences.filter((t) => t.status !== "completed").length;
          const slots = MAX_OPEN_PER_SERIES - open;
          if (slots <= 0 || dueDates.length === 0) continue;
          // ...but when a long gap owes more than the cap allows, keep the MOST RECENT
          // ones. Recreating the oldest missed days instead would leave today's job
          // missing, which is the one the worker actually needs to see; that a day was
          // skipped is already permanent in the trail.
          for (const when of dueDates.slice(-slots)) {
            const at = when.toISOString();
            generated.push(
              logActivity(
                {
                  ...blueprint,
                  id: `t-${crypto.randomUUID()}`,
                  status: "available",
                  dueAt: at,
                  createdAt: at,
                  seriesId,
                  autoGenerated: true,
                  // A fresh occurrence starts clean: last time's evidence, conversation
                  // and ticked steps belong to last time's record, not to this one.
                  proofs: [],
                  comments: [],
                  activity: [],
                  checklist: (newest.checklist ?? []).map((i) => ({ id: `ck-${crypto.randomUUID()}`, text: i.text, done: false })),
                },
                { by: "", action: "created", detail: "אוטומטית, לפי התדירות שהוגדרה" },
                at
              )
            );
          }
        }

        if (generated.length > 0) {
          children[childId] = { ...child, tasks: [...generated, ...child.tasks] };
          changed = true;
        }
      }

      if (!changed) return state;
      return { ...state, family: { ...state.family, children } };
    }
    case "STOP_TASK_SERIES": {
      // Ending a series is a property of its newest occurrence, because that's the one
      // generation reads — no separate series record to keep in sync.
      const at = action.at ?? new Date().toISOString();
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) =>
          mapTask(c, action.taskId, (t) => logActivity({ ...t, seriesStoppedAt: at }, { by: action.by ?? "", action: "commented", detail: "המשימה הקבועה הופסקה" }, at))
        ),
      };
    }
    case "RESUME_TASK_SERIES": {
      const at = action.at ?? new Date().toISOString();
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) =>
          mapTask(c, action.taskId, (t) => {
            // Firebase's set() rejects undefined, so clear the flag by dropping the key.
            const { seriesStoppedAt: _stopped, ...rest } = t;
            return logActivity(rest, { by: action.by ?? "", action: "commented", detail: "המשימה הקבועה חודשה" }, at);
          })
        ),
      };
    }
    case "TOGGLE_CHECKLIST_ITEM": {
      const at = action.at ?? new Date().toISOString();
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) =>
          mapTask(c, action.taskId, (t) => ({
            ...t,
            checklist: (t.checklist ?? []).map((i) =>
              i.id === action.itemId ? (i.done ? { id: i.id, text: i.text, done: false } : { ...i, done: true, doneAt: at, doneBy: action.by ?? "" }) : i
            ),
          }))
        ),
      };
    }
    case "ADD_SUPPLIER": {
      // Firebase's set() rejects undefined, so an omitted optional field is an omitted
      // key rather than a key holding undefined.
      const supplier: Supplier = {
        id: `sp-${crypto.randomUUID()}`,
        name: action.name.trim(),
        phone: action.phone.trim(),
        addedAt: action.at ?? new Date().toISOString(),
        ...(action.category?.trim() ? { category: action.category.trim() } : {}),
        ...(action.email?.trim() ? { email: action.email.trim() } : {}),
        ...(action.note?.trim() ? { note: action.note.trim() } : {}),
      };
      if (!supplier.name || !supplier.phone) return state;
      return { ...state, family: { ...state.family, suppliers: [...(state.family.suppliers ?? []), supplier] } };
    }
    case "UPDATE_SUPPLIER": {
      return {
        ...state,
        family: {
          ...state.family,
          suppliers: (state.family.suppliers ?? []).map((sp) =>
            sp.id !== action.supplierId
              ? sp
              : {
                  id: sp.id,
                  addedAt: sp.addedAt,
                  name: action.name.trim(),
                  phone: action.phone.trim(),
                  ...(action.category?.trim() ? { category: action.category.trim() } : {}),
                  ...(action.email?.trim() ? { email: action.email.trim() } : {}),
                  ...(action.note?.trim() ? { note: action.note.trim() } : {}),
                }
          ),
        },
      };
    }
    case "REMOVE_SUPPLIER": {
      return { ...state, family: { ...state.family, suppliers: (state.family.suppliers ?? []).filter((sp) => sp.id !== action.supplierId) } };
    }
    case "ADD_DOCUMENT": {
      const doc: CompanyDoc = {
        id: `dc-${crypto.randomUUID()}`,
        title: action.title.trim(),
        kind: action.kind,
        content: action.content,
        addedAt: action.at ?? new Date().toISOString(),
        addedBy: action.by,
        ...(action.path ? { path: action.path } : {}),
        ...(action.size !== undefined ? { size: action.size } : {}),
        ...(action.mime ? { mime: action.mime } : {}),
        ...(action.note?.trim() ? { note: action.note.trim() } : {}),
      };
      if (!doc.title || !doc.content) return state;
      return { ...state, family: { ...state.family, documents: [doc, ...(state.family.documents ?? [])] } };
    }
    case "REMOVE_DOCUMENT": {
      // Removing the record must not leave its file behind in the bucket paying rent
      // forever. Fire-and-forget: a failed cleanup is untidy, but it must never stop
      // the removal the user asked for.
      const doc = (state.family.documents ?? []).find((d) => d.id === action.docId);
      if (doc?.path) void deleteStoredFile(doc.path);
      return { ...state, family: { ...state.family, documents: (state.family.documents ?? []).filter((d) => d.id !== action.docId) } };
    }
    case "ADD_WORKER": {
      // A hire joins after onboarding. Built by the same factory the onboarding flow
      // uses, so a person added on day 100 is structurally identical to one added on
      // day 1 — and gets an invite code to sign in with, no work email required.
      const name = action.name.trim();
      if (!name) return state;
      const worker = templateChild(state.family.childOrder.length, name);
      // Two people can share a first name; keep ids unique so neither overwrites the other.
      const id = state.family.children[worker.id] ? `${worker.id}-${state.family.childOrder.length + 1}` : worker.id;
      return {
        ...state,
        family: {
          ...state.family,
          children: { ...state.family.children, [id]: { ...worker, id } },
          childOrder: [...state.family.childOrder, id],
        },
      };
    }
    case "ADD_HOUSE_RULE": {
      const rule: HouseRule = { id: `hr-${crypto.randomUUID()}`, text: action.text };
      return { ...state, family: { ...state.family, houseRules: [...state.family.houseRules, rule] } };
    }
    case "REMOVE_HOUSE_RULE": {
      return { ...state, family: { ...state.family, houseRules: state.family.houseRules.filter((r) => r.id !== action.ruleId) } };
    }
    case "RESET_CHILD_PROGRESS": {
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => ({
          ...c,
          balance: 0,
          savingsTotal: 0,
          transactions: [],
          savingsGoals: c.savingsGoals.map((g) => ({ ...g, current: 0 })),
          savingsHistory: [],
          redeemedGifts: [],
          tasks: c.tasks.map((t) => ({ ...t, status: "available" })),
          achievements: {
            ...c.achievements,
            savingsPaidProgress: 0,
            tasksCompletedCount: 0,
            consistencyStreakWeeks: 0,
          },
        })),
      };
    }
    case "ADD_EXTRA_CARD": {
      const card: ExtraCard = { id: `ec-${crypto.randomUUID()}`, name: action.name, category: action.category, cost: action.cost, note: action.note };
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => ({ ...c, extraCards: [...c.extraCards, card] })),
      };
    }
    case "REMOVE_EXTRA_CARD": {
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => ({ ...c, extraCards: c.extraCards.filter((card) => card.id !== action.cardId) })),
      };
    }
    case "ADD_TASK_TEMPLATE": {
      const template: TaskTemplate = { id: `tb-${crypto.randomUUID()}`, title: action.title, reward: action.reward, category: action.category };
      return { ...state, family: { ...state.family, taskBank: [template, ...state.family.taskBank] } };
    }
    case "UPDATE_TASK_TEMPLATE": {
      return {
        ...state,
        family: {
          ...state.family,
          taskBank: state.family.taskBank.map((t) =>
            t.id === action.templateId ? { ...t, title: action.title, reward: action.reward, category: action.category } : t
          ),
        },
      };
    }
    case "REMOVE_TASK_TEMPLATE": {
      return { ...state, family: { ...state.family, taskBank: state.family.taskBank.filter((t) => t.id !== action.templateId) } };
    }
    case "ADD_GIFT": {
      const gift: GiftBankItem = { id: `gb-${crypto.randomUUID()}`, title: action.title, cost: action.cost, category: action.category };
      return { ...state, family: { ...state.family, giftBank: [gift, ...state.family.giftBank] } };
    }
    case "REMOVE_GIFT": {
      return { ...state, family: { ...state.family, giftBank: state.family.giftBank.filter((g) => g.id !== action.giftId) } };
    }
    case "REVEAL_TASK_REWARD": {
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => ({
          ...c,
          tasks: c.tasks.map((t) => (t.id === action.taskId ? { ...t, rewardRevealed: true } : t)),
        })),
      };
    }
    case "OFFER_TASK_TRADE": {
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => ({
          ...c,
          tasks: c.tasks.map((t) => (t.id === action.taskId ? { ...t, tradeOfferedTo: action.toChildId } : t)),
        })),
      };
    }
    case "CANCEL_TASK_TRADE": {
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => ({
          ...c,
          tasks: c.tasks.map((t) => {
            if (t.id !== action.taskId) return t;
            const { tradeOfferedTo: _drop, ...rest } = t;
            return rest;
          }),
        })),
      };
    }
    case "APPROVE_TASK_TRADE": {
      const fromChild = state.family.children[action.fromChildId];
      const task = fromChild?.tasks.find((t) => t.id === action.taskId);
      if (!task || !task.tradeOfferedTo) return state;
      const toChildId = task.tradeOfferedTo;
      const newTask: TaskItem = { id: `t-${crypto.randomUUID()}`, title: task.title, reward: task.reward, category: task.category, status: "available" };
      const afterRemoval = mapChild(state.family, action.fromChildId, (c) => ({ ...c, tasks: c.tasks.filter((t) => t.id !== action.taskId) }));
      const afterAdd = mapChild(afterRemoval, toChildId, (c) => ({ ...c, tasks: [newTask, ...c.tasks] }));
      return { ...state, family: afterAdd };
    }
    default:
      return state;
  }
}

interface StoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  completeOnboarding: (email: string, password: string, name: string, childNames?: string[], companyName?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  registerChildSession: (code: string, username: string, password: string) => Promise<void>;
  loginChildSession: (username: string, password: string) => Promise<void>;
  registerSecondParentSession: (code: string, email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  uploadAttachment: (folder: string, file: File) => Promise<StoredFile>;
  describeUploadFailure: (err: unknown) => string;
  maxUploadBytes: number;
  resetPassword: (email: string) => Promise<void>;
}

const StoreCtx = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);
  const skipNextRemoteSave = useRef(false);

  // Firebase auth is the real source of truth. On sign-in, figure out whether this
  // identity is a parent (family owner) or a linked child account, then subscribe to
  // that family record in real time; on sign-out, fall back to the pre-onboarding state.
  useEffect(() => {
    let unsubFamily: (() => void) | null = null;
    const unsubAuth = onAuthChange((user) => {
      if (unsubFamily) {
        unsubFamily();
        unsubFamily = null;
      }
      if (user) {
        fetchChildLink(user.uid).then(async (childLink) => {
          const parentLink = childLink ? null : await fetchParentLink(user.uid);
          const familyUid = childLink ? childLink.familyUid : parentLink ? parentLink.familyUid : user.uid;
          const role: Role = childLink ? "child" : "parent";
          unsubFamily = subscribeFamily(familyUid, (family) => {
            if (family) {
              skipNextRemoteSave.current = true;
              dispatch({ type: "HYDRATE", uid: user.uid, familyUid, role, family, forcedChildId: childLink?.childId });
            }
          });
        });
      } else {
        dispatch({ type: "SIGN_OUT" });
      }
    });
    return () => {
      unsubAuth();
      if (unsubFamily) unsubFamily();
    };
  }, []);

  // Persist every local change: to localStorage always (instant-load cache), and to
  // Firebase whenever we're signed in — except for the one render right after a
  // HYDRATE, which already came FROM Firebase and would otherwise just write the same
  // data straight back. A child session only ever writes its own child subtree (all
  // the security rules allow it); a parent session writes the whole family.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (skipNextRemoteSave.current) {
      skipNextRemoteSave.current = false;
      return;
    }
    if (!state.familyUid) return;
    if (state.role === "child") {
      const child = state.family.children[state.activeChildId];
      if (child) saveChildOnly(state.familyUid, state.activeChildId, child).catch((err) => console.error("Failed to save child to Firebase:", err));
    } else {
      saveFamily(state.familyUid, state.family).catch((err) => console.error("Failed to save family to Firebase:", err));
    }
  }, [state]);

  // Recurring weekly allowance: whenever a parent session is loaded, credit any child
  // whose weekly allowance has come due, one clock-week at a time (capped so a long
  // absence doesn't drop a huge surprise sum). The first time it's seen it just stamps
  // the clock (pays nothing), so payments start accruing from now, and lastAllowancePaidAt
  // advancing makes it idempotent — re-runs after the dispatch find nothing due.
  useEffect(() => {
    if (!state.familyUid || state.role !== "parent") return;
    const WEEK = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const due = childrenList(state.family).some((c) => {
      const weekly = c.settings?.weeklyAllowance ?? 0;
      if (weekly <= 0) return false;
      if (!c.lastAllowancePaidAt) return true;
      const last = Date.parse(c.lastAllowancePaidAt);
      return Number.isNaN(last) || Math.floor((now - last) / WEEK) >= 1;
    });
    if (due) dispatch({ type: "ACCRUE_ALLOWANCES", now });
  }, [state.family, state.role, state.familyUid]);

  // Recurring work: whenever the app is open, materialise every occurrence of a
  // repeating job whose due date has arrived. The reducer derives what's missing from
  // the tasks already present, so running this on every render pass is safe — the
  // guard here only avoids dispatching when there is demonstrably nothing to create.
  // Either side can trigger it: a worker opening the app on Sunday morning should see
  // Sunday's job even if the manager hasn't logged in for a week.
  useEffect(() => {
    if (!state.familyUid) return;
    const now = Date.now();
    const horizon = endOfDay(new Date(now)).getTime();
    const due = childrenList(state.family).some((c) => {
      const newestBySeries = new Map<string, TaskItem>();
      for (const t of c.tasks) {
        if (!t.seriesId) continue;
        const current = newestBySeries.get(t.seriesId);
        if (!current || (toDate(t.dueAt)?.getTime() ?? 0) > (toDate(current.dueAt)?.getTime() ?? 0)) newestBySeries.set(t.seriesId, t);
      }
      return [...newestBySeries.values()].some((t) => {
        if (t.seriesStoppedAt || !t.recurrence || t.recurrence === "none") return false;
        const anchor = toDate(t.dueAt);
        if (!anchor) return false;
        const openInSeries = c.tasks.filter((o) => o.seriesId === t.seriesId && o.status !== "completed").length;
        return openInSeries < 3 && nextDueDate(anchor, t.recurrence).getTime() <= horizon;
      });
    });
    if (due) dispatch({ type: "ROLL_RECURRING_TASKS", now });
  }, [state.family, state.familyUid]);

  const completeOnboarding = useMemo(
    () => async (email: string, password: string, name: string, childNames?: string[], companyName?: string) => {
      await registerParent(email, password, name, childNames, companyName);
      // registerParent already wrote the family to Firebase. Fetch and dispatch it
      // directly here rather than waiting on the separate onAuthChange listener —
      // that listener can fire (and resolve) before this function even starts
      // waiting, since Firebase's own auth-state event and our write race each other.
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const family = await fetchFamily(uid);
      if (family) {
        skipNextRemoteSave.current = true;
        dispatch({ type: "HYDRATE", uid, familyUid: uid, role: "parent", family });
      }
    },
    []
  );

  const login = useMemo(
    () => async (email: string, password: string) => {
      await loginParent(email, password);
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      // This login could be the family owner, or a second parent linked to someone
      // else's family — check which before deciding where to load data from.
      const parentLink = await fetchParentLink(uid);
      const familyUid = parentLink ? parentLink.familyUid : uid;
      const family = await fetchFamily(familyUid);
      if (family) {
        skipNextRemoteSave.current = true;
        dispatch({ type: "HYDRATE", uid, familyUid, role: "parent", family });
      }
    },
    []
  );

  const registerSecondParentSession = useMemo(
    () => async (code: string, email: string, password: string, name: string) => {
      const { familyUid, family } = await registerSecondParent(code, email, password, name);
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      skipNextRemoteSave.current = true;
      dispatch({ type: "HYDRATE", uid, familyUid, role: "parent", family });
    },
    []
  );

  const registerChildSession = useMemo(
    () => async (code: string, username: string, password: string) => {
      const { familyUid, childId, family } = await registerChild(code, username, password);
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      skipNextRemoteSave.current = true;
      dispatch({ type: "HYDRATE", uid, familyUid, role: "child", family, forcedChildId: childId });
    },
    []
  );

  const loginChildSession = useMemo(
    () => async (username: string, password: string) => {
      await loginChild(username, password);
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const link = await fetchChildLink(uid);
      if (!link) throw new Error("child-link-missing");
      const family = await fetchFamily(link.familyUid);
      if (family) {
        skipNextRemoteSave.current = true;
        dispatch({ type: "HYDRATE", uid, familyUid: link.familyUid, role: "child", family, forcedChildId: link.childId });
      }
    },
    []
  );

  const logout = useMemo(() => async () => logoutParent(), []);
  // Screens are not allowed to reach Firebase directly, so uploading goes through
  // here like every other write.
  const uploadAttachment = useMemo(
    () => async (folder: string, file: File) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("not-signed-in");
      return uploadToStorage(uid, folder, file);
    },
    []
  );
  // Only the account owner can close the account. A second admin shares write access
  // to the record but the login being deleted is not theirs, so the two halves would
  // come apart: the data gone, the owner's sign-in still live and pointing at nothing.
  const deleteAccount = useMemo(
    () => async (password: string) => {
      if (state.role !== "parent" || !state.uid || state.uid !== state.familyUid) throw new Error("not-owner");
      await deleteOwnAccount(password);
    },
    [state.role, state.uid, state.familyUid]
  );
  const resetPassword = useMemo(() => async (email: string) => resetParentPassword(email), []);

  const value = useMemo(
    () => ({ state, dispatch, completeOnboarding, login, registerChildSession, loginChildSession, registerSecondParentSession, logout, deleteAccount, uploadAttachment, describeUploadFailure: describeUploadError, maxUploadBytes: MAX_UPLOAD_BYTES, resetPassword }),
    [state, completeOnboarding, login, registerChildSession, loginChildSession, registerSecondParentSession, logout, deleteAccount, uploadAttachment, resetPassword]
  );
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useActiveChild(): Child {
  const { state } = useStore();
  return state.family.children[state.activeChildId] ?? childrenList(state.family)[0];
}

/**
 * True when a parent is previewing a child's screen (role parent + child view) rather
 * than a real child login. In this mode the child's screens are read-only: the parent
 * sees exactly what the child sees but can't perform the child's actions on their behalf.
 */
/**
 * Who you are, and which side you are looking at — two different things that every
 * work screen was conflating.
 *
 * `role` comes from the account and cannot change; `viewMode` is the manager's toggle
 * for seeing the worker's screen. Reading only `role` meant a manager who switched to
 * the worker view got the worker's label over the manager's controls.
 *
 * Preview is deliberately look-only. This product is an audit trail: if a manager
 * could start or submit work from the worker's screen, the log would record that the
 * worker did it, and the record would be worth nothing.
 */
export function useWorkView(): { isManager: boolean; isWorker: boolean; isPreview: boolean } {
  const { state } = useStore();
  return {
    isManager: state.role === "parent" && state.viewMode === "parent",
    isWorker: state.role === "child",
    isPreview: state.role === "parent" && state.viewMode === "child",
  };
}

export function useIsParentPreview(): boolean {
  const { state } = useStore();
  return state.role === "parent" && state.viewMode === "child";
}
