import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useReducer, type ReactNode } from "react";
import { seedFamily, templateChild } from "./seed";
import { childrenList, genInviteCode, normalizeFamily } from "./family";
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
  identityLabel,
  ensureSomeSession,
  createFamilyForCurrentUser,
  resetParentPassword,
  deleteOwnAccount,
} from "../firebase/auth";
import { auth } from "../firebase/config";
import { runReadinessChecks, type CheckResult } from "../firebase/diagnostics";
import { uploadFile as uploadToStorage, deleteStoredFile, describeUploadError, MAX_UPLOAD_BYTES, type StoredFile } from "../firebase/storage";
import {
  subscribeFamily,
  saveFamily,
  saveChildOnly,
  createInviteCode,
  publishTaskLink,
  fetchTaskLink,
  pushLinkUpdate,
  subscribeLinkInbox,
  clearInboxEntry,
  publishWorkerDay,
  fetchWorkerDay,
} from "../firebase/db";
import type { LinkUpdate, TaskLinkSnapshot, WorkerDaySnapshot } from "./tasklink";

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
      /** The form generates the id up front so files can be uploaded into the task's
       * own folder before the task itself exists. */
      id?: string;
      linkToken?: string;
      crewId?: string;
      title: string;
      brief?: string;
      briefAttachments?: Attachment[];
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
  | { type: "UPDATE_TASK"; childId: string; taskId: string; title: string; brief?: string; dueAt?: string; priority?: TaskPriority; site?: string; by?: string; at?: string }
  | { type: "REASSIGN_TASK"; fromChildId: string; toChildId: string; taskId: string; by?: string; at?: string }
  | { type: "DELETE_TASK"; childId: string; taskId: string }
  | { type: "ADD_CHECKLIST_ITEM"; childId: string; taskId: string; text: string }
  | { type: "REMOVE_CHECKLIST_ITEM"; childId: string; taskId: string; itemId: string }
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
  | { type: "RESET_WORKER_ACCESS"; childId: string }
  | { type: "SET_WORKER_PHONE"; childId: string; phone: string }
  | { type: "SET_PROFESSION"; professionId: string }
  | { type: "SET_REQUIRE_PROOF"; value: boolean }
  | { type: "ENSURE_DAY_TOKENS" }
  | { type: "APPLY_LINK_UPDATE"; childId: string; taskId: string; kind: LinkUpdate["kind"]; at: string; by: string; note?: string; photo?: string; name?: string; file?: LinkUpdate["file"] }
  | { type: "MARK_TASK_SEEN"; childId: string; taskId: string; by: string; at?: string }
  | { type: "ACKNOWLEDGE_TASK"; childId: string; taskId: string; by: string; at?: string }
  | { type: "MARK_TASK_SENT"; childId: string; taskId: string; by: string; at?: string }
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
      // viewMode is a preview toggle, not a saved preference: it says "right now I'm
      // peeking at the other side's screen", and it has no business surviving a
      // reload. Restoring it meant a manager who once tapped the worker pill came
      // back in preview forever — and preview is deliberately look-only, so every
      // control they were looking for (attach a file, edit, approve) was hidden.
      // Opening the app always puts you on your own side; the pill still works within
      // the session.
      if (isValidState(parsed))
        return { ...parsed, uid: null, viewMode: parsed.role === "child" ? "child" : "parent", family: normalizeFamily(parsed.family) };
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
        // Signing in puts you on your OWN side. Carrying the previous viewMode over
        // meant one tap on the worker preview stuck permanently: every later load and
        // every later sign-in returned the manager to the worker's screen, where their
        // own controls do not exist. Previewing is a within-session look, not a saved
        // preference.
        viewMode: action.role === "child" ? "child" : "parent",
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
      const id = action.id ?? `t-${crypto.randomUUID()}`;
      // The token travels in the WhatsApp message and is the worker's whole permission,
      // so it is created with the task rather than bolted on when someone shares it.
      const linkToken = action.linkToken ?? crypto.randomUUID().replace(/-/g, "");
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
          linkToken,
          ...(action.crewId ? { crewId: action.crewId } : {}),
          briefAttachments: action.briefAttachments ?? [],
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
    case "UPDATE_TASK": {
      const at = action.at ?? new Date().toISOString();
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) =>
          mapTask(c, action.taskId, (t) => {
            // Name what actually changed. "עודכנה" on its own tells a reader nothing,
            // and this trail exists to answer "what happened to this task".
            const changed: string[] = [];
            if (action.title.trim() !== t.title) changed.push("כותרת");
            if ((action.brief ?? "") !== (t.brief ?? "")) changed.push("פירוט");
            if ((action.dueAt ?? "") !== (t.dueAt ?? "")) changed.push("תאריך יעד");
            if ((action.priority ?? "normal") !== (t.priority ?? "normal")) changed.push("עדיפות");
            if ((action.site ?? "") !== (t.site ?? "")) changed.push("לקוח / אתר");
            if (changed.length === 0) return t;
            // Firebase rejects undefined, so a cleared field is a removed key.
            const { brief: _b, dueAt: _d, site: _s, ...rest } = t;
            return logActivity(
              {
                ...rest,
                title: action.title.trim(),
                priority: action.priority ?? "normal",
                ...(action.brief?.trim() ? { brief: action.brief.trim() } : {}),
                ...(action.dueAt ? { dueAt: action.dueAt } : {}),
                ...(action.site?.trim() ? { site: action.site.trim() } : {}),
              },
              { by: action.by ?? "", action: "edited", detail: changed.join(", ") },
              at
            );
          })
        ),
      };
    }
    case "REASSIGN_TASK": {
      // The task moves between two people's lists, carrying its whole history with it —
      // re-creating it on the other side would erase everything that already happened.
      const at = action.at ?? new Date().toISOString();
      const from = state.family.children[action.fromChildId];
      const to = state.family.children[action.toChildId];
      const task = from?.tasks.find((t) => t.id === action.taskId);
      if (!from || !to || !task || from.id === to.id) return state;
      const moved = logActivity(task, { by: action.by ?? "", action: "reassigned", detail: `מ${from.name} ל${to.name}` }, at);
      return {
        ...state,
        family: {
          ...state.family,
          children: {
            ...state.family.children,
            [from.id]: { ...from, tasks: from.tasks.filter((t) => t.id !== action.taskId) },
            [to.id]: { ...to, tasks: [moved, ...to.tasks] },
          },
        },
      };
    }
    case "DELETE_TASK": {
      // A job sent to the wrong person, or cancelled by the customer before anyone
      // moved, is a real and ordinary event, and refusing to delete it left the board
      // carrying work nobody would ever do. So deleting is allowed at any stage — but
      // never made easy: the screen states what record is about to go with it, because
      // destroying a record is still the thing this product exists not to do.
      const child = state.family.children[action.childId];
      const task = child?.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      // Every photo a job accumulates now lives in Storage, not inline — a round at
      // twenty stops is fifty objects in the bucket, and REMOVE_DOCUMENT already
      // proved what happens to a record's files when nobody frees them: they keep
      // paying rent forever. Fire-and-forget, same as there: a cleanup that failed
      // must never be the reason a delete the user asked for did not happen.
      for (const a of [...(task.proofs ?? []), ...(task.briefAttachments ?? [])]) {
        if (a.path) void deleteStoredFile(a.path);
      }
      return { ...state, family: mapChild(state.family, action.childId, (c) => ({ ...c, tasks: c.tasks.filter((t) => t.id !== action.taskId) })) };
    }
    case "ADD_CHECKLIST_ITEM": {
      const text = action.text.trim();
      if (!text) return state;
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) =>
          mapTask(c, action.taskId, (t) => ({ ...t, checklist: [...(t.checklist ?? []), { id: `ck-${crypto.randomUUID()}`, text, done: false }] }))
        ),
      };
    }
    case "REMOVE_CHECKLIST_ITEM": {
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) =>
          mapTask(c, action.taskId, (t) => ({ ...t, checklist: (t.checklist ?? []).filter((i) => i.id !== action.itemId) }))
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
      const worker = { ...templateChild(state.family.childOrder.length, name), dayToken: crypto.randomUUID().replace(/-/g, "") };
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
    case "APPLY_LINK_UPDATE": {
      // What a worker reported from the WhatsApp link, folded into the record as if
      // they had done it in the app — same statuses, same trail, same evidence. The
      // journal must not be able to tell the difference, because to the business there
      // is none.
      const at = action.at;
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) =>
          mapTask(c, action.taskId, (t) => {
            if (action.kind === "ack") {
              if (t.acknowledgedAt) return t;
              return logActivity({ ...t, acknowledgedAt: at, seenAt: t.seenAt ?? at }, { by: action.by, action: "acknowledged" }, at);
            }
            if (action.kind === "started") {
              if (t.status !== "available") return t;
              return logActivity({ ...t, status: "in_progress", startedAt: at, seenAt: t.seenAt ?? at }, { by: action.by, action: "started" }, at);
            }
            if (action.kind === "done") {
              if (t.status === "completed" || t.status === "pending_approval") return t;
              return logActivity({ ...t, status: "pending_approval", submittedAt: at, seenAt: t.seenAt ?? at }, { by: action.by, action: "submitted" }, at);
            }
            // A photo used to carry its own bytes inline; now it leaves them in
            // Storage the same way a file does, because a job's evidence can run to
            // dozens of shots and the whole family record loads as one object on
            // every sign-in — fifty inline photos is a record too big to load
            // quickly, forever. `action.photo` (base64) is read only when no
            // uploaded file came with the update, for the rare update still queued
            // on a phone from before this changed.
            const attachment: Attachment =
              action.kind === "file" || (action.kind === "photo" && action.file)
                ? {
                    id: `at-${crypto.randomUUID()}`,
                    kind: action.kind === "photo" ? "image" : "file",
                    name: action.kind === "photo" ? action.name?.trim() || "צילום מהשטח" : action.file?.name || "קובץ מהשטח",
                    content: action.file?.url ?? "",
                    ...(action.file?.path ? { path: action.file.path } : {}),
                    ...(action.file?.size ? { size: action.file.size } : {}),
                    ...(action.file?.mime ? { mime: action.file.mime } : {}),
                    addedAt: at,
                    addedBy: action.by,
                  }
                : {
                    id: `at-${crypto.randomUUID()}`,
                    kind: action.kind === "photo" ? "image" : "note",
                    name: action.kind === "photo" ? (action.name?.trim() || "צילום מהשטח") : "הערת ביצוע",
                    content: action.kind === "photo" ? (action.photo ?? "") : (action.note ?? ""),
                    addedAt: at,
                    addedBy: action.by,
                  };
            return logActivity({ ...t, proofs: [...(t.proofs ?? []), attachment] }, { by: action.by, action: "attached" }, at);
          })
        ),
      };
    }
    case "ENSURE_DAY_TOKENS": {
      // Workers created before the daily link existed have no token, and a manager
      // should never have to know that. Filling them in is idempotent, so the effect
      // that calls this can run on every load.
      const missing = childrenList(state.family).filter((c) => !c.dayToken);
      if (missing.length === 0) return state;
      let family = state.family;
      for (const worker of missing) {
        family = mapChild(family, worker.id, (c) => ({ ...c, dayToken: crypto.randomUUID().replace(/-/g, "") }));
      }
      return { ...state, family };
    }
    case "SET_REQUIRE_PROOF":
      return { ...state, family: { ...state.family, requireProof: action.value } };
    case "SET_PROFESSION": {
      const next = { ...state.family };
      if (action.professionId) next.professionId = action.professionId;
      else delete next.professionId;
      return { ...state, family: next };
    }
    case "SET_WORKER_PHONE": {
      const phone = action.phone.trim();
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => {
          const next = { ...c };
          if (phone) next.phone = phone;
          else delete next.phone;
          return next;
        }),
      };
    }
    case "MARK_TASK_SEEN": {
      // Stamped once, by the app, the first time the assigned worker opens the task.
      // Re-stamping on every visit would turn "when he first saw it" — the fact that
      // settles an argument — into "when he last looked".
      const at = action.at ?? new Date().toISOString();
      const existing = state.family.children[action.childId]?.tasks.find((t) => t.id === action.taskId);
      if (!existing || existing.seenAt) return state;
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) =>
          mapTask(c, action.taskId, (t) => logActivity({ ...t, seenAt: at }, { by: action.by, action: "seen" }, at))
        ),
      };
    }
    case "ACKNOWLEDGE_TASK": {
      const at = action.at ?? new Date().toISOString();
      const existing = state.family.children[action.childId]?.tasks.find((t) => t.id === action.taskId);
      if (!existing || existing.acknowledgedAt) return state;
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) =>
          mapTask(c, action.taskId, (t) => logActivity({ ...t, acknowledgedAt: at, seenAt: t.seenAt ?? at }, { by: action.by, action: "acknowledged" }, at))
        ),
      };
    }
    case "MARK_TASK_SENT": {
      // Sending happens outside the app, in WhatsApp. What the journal can honestly
      // record is that the manager sent it, and when.
      const at = action.at ?? new Date().toISOString();
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) =>
          mapTask(c, action.taskId, (t) => logActivity(t, { by: action.by, action: "sent" }, at))
        ),
      };
    }
    case "RESET_WORKER_ACCESS": {
      // A worker locked out of their own login gets a new invite code and their link
      // cleared, so they can sign up again from a fresh link. The code index is kept in
      // step by the effect that watches the family record, so the new code is live
      // without anything else having to remember to publish it.
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => {
          const next = { ...c, inviteCode: genInviteCode() };
          delete next.authUid;
          return next;
        }),
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

/**
 * What the app knows about its own connection, as plain facts a person can read.
 *
 * Every "it doesn't work" in this product so far has come down to invisible state:
 * which account is actually signed in, and whether the record on screen came from the
 * server or from the device's cache. Guessing at that from the outside is what made
 * those bugs take days, so the app now reports it.
 */
export interface ConnectionInfo {
  /** The identity Firebase has signed in right now — not the name in the record. */
  signedInAs: string | null;
  /** True once the family record has actually arrived from the server this session. */
  live: boolean;
  /** Set when a read or a write was refused or failed; the screen is then cache-only. */
  error: string | null;
  /** True while there are local changes the server has not accepted. Work done on a
   * roof with no signal is the normal case here, not an edge case. */
  unsaved: boolean;
  /** When the last save attempt failed. */
  failedAt: string | null;
  /** The session belongs to somebody other than the record on this device — an
   * anonymous worker session holding a manager's data. Retrying a save can never fix
   * that, so the screen has to offer signing in again instead of a doomed button. */
  sessionLost: boolean;
}


function describeSyncError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  const message = (err as { message?: string })?.message ?? "";
  if (code.includes("permission") || message.toLowerCase().includes("permission")) {
    return "השרת דחה את הקריאה (הרשאות מסד הנתונים)";
  }
  if (code.includes("network") || message.toLowerCase().includes("network")) return "אין חיבור לשרת";
  return "טעינת הנתונים מהשרת נכשלה";
}

interface StoreContextValue {
  state: AppState;
  connection: ConnectionInfo;
  dispatch: React.Dispatch<Action>;
  completeOnboarding: (email: string, password: string, name: string, childNames?: string[], companyName?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  /** Finishes an account whose login exists but whose company record never saved. */
  completeMissingAccount: (name: string, companyName: string) => Promise<void>;
  /** Pushes whatever is unsaved to the server again, on demand. */
  retrySync: () => Promise<void>;
  /** Tests the three console switches the worker links depend on. */
  checkReadiness: () => Promise<CheckResult[]>;
  /** Reads the one task behind a share token — for the no-account worker screen. */
  loadTaskLink: (token: string) => Promise<TaskLinkSnapshot | null>;
  /** Reads one person's whole open list behind their daily token. */
  loadWorkerDay: (token: string) => Promise<WorkerDaySnapshot | null>;
  /** Reports progress on one task from within a daily link. */
  sendDayUpdate: (day: WorkerDaySnapshot, taskId: string, update: LinkUpdate) => Promise<void>;
  /** Reports progress on that task back to the manager's inbox. */
  sendLinkUpdate: (link: TaskLinkSnapshot, update: LinkUpdate) => Promise<void>;
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
  const [connection, setConnection] = useState<ConnectionInfo>({ signedInAs: null, live: false, error: null, unsaved: false, failedAt: null, sessionLost: false });
  const skipNextRemoteSave = useRef(false);
  const latestState = useRef(state);
  latestState.current = state;

  /**
   * The one path from local state to the server.
   *
   * A rejected save used to end at console.error: the change stayed on screen, looked
   * saved, and was gone on the next load with nothing having said so. Now a failure is
   * recorded and shown, and it can be retried — by the app when the network returns,
   * or by the person, from settings.
   */
  const pushToServer = useCallback(async (snapshot: AppState) => {
    if (!snapshot.familyUid) return;
    try {
      if (snapshot.role === "child") {
        const child = snapshot.family.children[snapshot.activeChildId];
        if (child) await saveChildOnly(snapshot.familyUid, snapshot.activeChildId, child);
      } else {
        await saveFamily(snapshot.familyUid, snapshot.family);
      }
      setConnection((c) => (c.unsaved || c.error ? { ...c, unsaved: false, error: null, failedAt: null } : c));
    } catch (err) {
      console.error("Failed to save to Firebase:", err);
      setConnection((c) => ({ ...c, live: false, unsaved: true, error: describeSyncError(err), failedAt: new Date().toISOString() }));
    }
  }, []);

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
        // An anonymous session is what a worker's link runs on, and it has no business
        // holding somebody's company record. When one turns up while the cached state
        // still belongs to a real account, every write is refused and the app sits
        // there reporting "not connected" over a session that is very much connected —
        // just as the wrong person. Naming it is the difference between a sign-out and
        // an evening.
        if (user.isAnonymous && latestState.current.familyUid && latestState.current.familyUid !== user.uid) {
          setConnection((c) => ({
            ...c,
            signedInAs: null,
            live: false,
            error: "החיבור לחשבון אבד — צריך להתנתק ולהתחבר מחדש כדי שהעבודה תישמר לשרת.",
            sessionLost: true,
          }));
          return;
        }
        setConnection((c) => ({ ...c, signedInAs: identityLabel(user.email), live: false, error: null, sessionLost: false }));
        fetchChildLink(user.uid)
          .then(async (childLink) => {
            const parentLink = childLink ? null : await fetchParentLink(user.uid);
            const familyUid = childLink ? childLink.familyUid : parentLink ? parentLink.familyUid : user.uid;
            const role: Role = childLink ? "child" : "parent";
            unsubFamily = subscribeFamily(
              familyUid,
              (family) => {
                if (family) {
                  skipNextRemoteSave.current = true;
                  dispatch({ type: "HYDRATE", uid: user.uid, familyUid, role, family, forcedChildId: childLink?.childId });
                  setConnection((c) => ({ ...c, live: true, error: null }));
                } else {
                  // Signed in, allowed to read, and there is nothing there: a real
                  // state (a deleted account), not a connection problem.
                  setConnection((c) => ({ ...c, live: false, error: "לא נמצא רשומת עסק לחשבון הזה" }));
                }
              },
              (err) => {
                console.error("Family subscription failed:", err);
                setConnection((c) => ({ ...c, live: false, error: describeSyncError(err) }));
              }
            );
          })
          // Without this the promise rejected in silence: no HYDRATE, no listener, and
          // the app went on showing the cached record from whoever used this browser
          // last — including the wrong role.
          .catch((err) => {
            console.error("Resolving the signed-in identity failed:", err);
            setConnection((c) => ({ ...c, live: false, error: describeSyncError(err) }));
          });
      } else {
        setConnection({ signedInAs: null, live: false, error: null, unsaved: false, failedAt: null, sessionLost: false });
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
    void pushToServer(state);
  }, [state, pushToServer]);

  // Losing signal mid-job is the normal condition on a site, not an edge case. The
  // change is already safe in local storage; when the connection comes back the app
  // pushes it rather than waiting for the next thing the person happens to change.
  useEffect(() => {
    const retry = () => {
      if (latestState.current.familyUid) void pushToServer(latestState.current);
    };
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [pushToServer]);

  // An invite code only works if it exists at `inviteCodes/{code}`, which is where a
  // person who is not yet linked to anything is allowed to look it up. That index was
  // written once, at registration, for the workers who existed at that moment — so
  // every worker added afterwards had a code printed on their invite link that the
  // database had never heard of. Their sign-up failed with "invalid code" AFTER their
  // login was created, leaving an account that could not get in anywhere.
  //
  // The family record is the truth; this keeps the index in step with it. Writing the
  // same code again is harmless, so it also repairs every invite already handed out.
  const publishedCodes = useRef(new Set<string>());
  useEffect(() => {
    // The rules let only the account owner write this index (a code names its family),
    // so a second admin's session must not try.
    if (!state.familyUid || state.uid !== state.familyUid) return;
    for (const child of childrenList(state.family)) {
      if (!child.inviteCode || publishedCodes.current.has(child.inviteCode)) continue;
      publishedCodes.current.add(child.inviteCode);
      createInviteCode(state.familyUid, child.id, child.inviteCode).catch((err) => {
        publishedCodes.current.delete(child.inviteCode);
        console.error("Publishing an invite code failed:", err);
      });
    }
  }, [state.family, state.familyUid, state.uid]);

  // The link a worker opens is a snapshot of one task, republished whenever the task
  // changes. It is deliberately a copy: the person holding the link gets that task and
  // nothing else, never a door into the company record.
  const publishedLinks = useRef(new Map<string, string>());
  useEffect(() => {
    if (!state.familyUid || state.role !== "parent") return;
    const company = state.family.companyName || state.family.parentName;
    for (const worker of childrenList(state.family)) {
      for (const task of worker.tasks) {
        if (!task.linkToken || task.status === "completed") continue;
        const signature = [
          task.title,
          task.brief ?? "",
          task.dueAt ?? "",
          task.site ?? "",
          task.status,
          (task.checklist ?? []).map((c) => `${c.text}:${c.done}`).join("|"),
          String((task.comments ?? []).length),
        ].join("~");
        if (publishedLinks.current.get(task.linkToken) === signature) continue;
        publishedLinks.current.set(task.linkToken, signature);
        const snapshot: TaskLinkSnapshot = {
          familyUid: state.familyUid,
          childId: worker.id,
          taskId: task.id,
          company,
          workerName: worker.name,
          title: task.title,
          status: task.status,
          ...(task.brief ? { brief: task.brief } : {}),
          ...(task.dueAt ? { dueAt: task.dueAt } : {}),
          ...(task.site ? { site: task.site } : {}),
          ...((task.checklist ?? []).length > 0 ? { steps: (task.checklist ?? []).map((c) => ({ id: c.id, text: c.text, done: c.done })) } : {}),
          ...((task.comments ?? []).length > 0
            ? { messages: (task.comments ?? []).slice(-3).map((c) => ({ at: c.at, by: c.by, text: c.text })) }
            : {}),
        };
        publishTaskLink(task.linkToken, snapshot).catch((err) => {
          publishedLinks.current.delete(task.linkToken!);
          console.error("Publishing a task link failed:", err);
        });
      }
    }
  }, [state.family, state.familyUid, state.role]);

  // One person's whole plate, on one link. A message per task is how a chat turns into
  // the mess this product exists to replace — the morning message is one link, and it
  // stays correct as the day changes because it is republished when the work does.
  const publishedDays = useRef(new Map<string, string>());
  useEffect(() => {
    if (!state.familyUid || state.role !== "parent") return;
    if (childrenList(state.family).some((c) => !c.dayToken)) {
      dispatch({ type: "ENSURE_DAY_TOKENS" });
      return;
    }
    const company = state.family.companyName || state.family.parentName;
    for (const worker of childrenList(state.family)) {
      const open = worker.tasks.filter((t) => t.status !== "completed");
      const signature =
        open
          .map(
            (t) =>
              `${t.id}:${t.title}:${t.brief ?? ""}:${t.site ?? ""}:${t.status}:${t.dueAt ?? ""}:${t.acknowledgedAt ? "a" : ""}:${(t.proofs ?? []).length}:${(t.comments ?? []).length}`
          )
          .join("|") +
        `~${state.family.requireProof !== false}`;
      if (!worker.dayToken || publishedDays.current.get(worker.dayToken) === signature) continue;
      publishedDays.current.set(worker.dayToken, signature);
      const snapshot: WorkerDaySnapshot = {
        familyUid: state.familyUid,
        childId: worker.id,
        company,
        workerName: worker.name,
        tasks: open.map((t) => ({
          taskId: t.id,
          title: t.title,
          status: t.status,
          ...(t.brief ? { brief: t.brief } : {}),
          ...(t.dueAt ? { dueAt: t.dueAt } : {}),
          ...(t.site ? { site: t.site } : {}),
          ...((t.checklist ?? []).length > 0 ? { steps: (t.checklist ?? []).map((c) => ({ id: c.id, text: c.text, done: c.done })) } : {}),
          ...(t.acknowledgedAt ? { acknowledged: true } : {}),
          proofCount: (t.proofs ?? []).length,
          ...((t.comments ?? []).length > 0
            ? { messages: (t.comments ?? []).slice(-3).map((c) => ({ at: c.at, by: c.by, text: c.text })) }
            : {}),
        })),
        requireProof: state.family.requireProof !== false,
      };
      publishWorkerDay(worker.dayToken, snapshot).catch((err) => {
        publishedDays.current.delete(worker.dayToken!);
        console.error("Publishing a worker day link failed:", err);
      });
    }
  }, [state.family, state.familyUid, state.role]);

  // Everything workers reported from their links, folded into the journal. One listener
  // on the company's own inbox rather than one per task, and each entry is removed once
  // it has been applied so it can never land twice.
  const appliedInboxEntries = useRef(new Set<string>());
  useEffect(() => {
    if (!state.familyUid || state.role !== "parent") return;
    const familyUid = state.familyUid;
    return subscribeLinkInbox(
      familyUid,
      (entries) => {
        for (const [entryId, entry] of Object.entries(entries)) {
          if (appliedInboxEntries.current.has(entryId)) continue;
          appliedInboxEntries.current.add(entryId);
          dispatch({
            type: "APPLY_LINK_UPDATE",
            childId: entry.childId,
            taskId: entry.taskId,
            kind: entry.kind,
            at: entry.at,
            by: entry.by,
            ...(entry.note ? { note: entry.note } : {}),
            ...(entry.photo ? { photo: entry.photo } : {}),
            ...(entry.name ? { name: entry.name } : {}),
            ...(entry.file ? { file: entry.file } : {}),
          });
          clearInboxEntry(familyUid, entryId).catch((err) => console.error("Clearing a link update failed:", err));
        }
      },
      (err) => console.error("Watching the link inbox failed:", err)
    );
  }, [state.familyUid, state.role]);

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
      // Returning quietly here left the sign-in "successful" while the app carried on
      // showing whatever the browser had cached — the previous account's record, the
      // previous account's role. A sign-in that cannot load its own data has failed.
      if (!family) throw new Error("family-not-found");
      skipNextRemoteSave.current = true;
      dispatch({ type: "HYDRATE", uid, familyUid, role: "parent", family });
    },
    []
  );

  const loadTaskLink = useCallback(async (token: string) => {
    await ensureSomeSession();
    return fetchTaskLink(token);
  }, []);

  const sendLinkUpdate = useCallback(async (link: TaskLinkSnapshot, update: LinkUpdate) => {
    await ensureSomeSession();
    await pushLinkUpdate(link.familyUid, {
      ...update,
      token: link.familyUid && link.taskId ? `${link.taskId}` : "",
      childId: link.childId,
      taskId: link.taskId,
      by: link.workerName,
    });
  }, []);

  const loadWorkerDay = useCallback(async (token: string) => {
    await ensureSomeSession();
    return fetchWorkerDay(token);
  }, []);

  const sendDayUpdate = useCallback(async (day: WorkerDaySnapshot, taskId: string, update: LinkUpdate) => {
    await ensureSomeSession();
    await pushLinkUpdate(day.familyUid, { ...update, token: taskId, childId: day.childId, taskId, by: day.workerName });
  }, []);

  const checkReadiness = useCallback(async () => {
    const sample = childrenList(latestState.current.family).find((c) => c.dayToken)?.dayToken ?? null;
    return runReadinessChecks(sample);
  }, []);

  const retrySync = useCallback(async () => {
    await pushToServer(latestState.current);
  }, [pushToServer]);

  const completeMissingAccount = useMemo(
    () => async (name: string, companyName: string) => {
      const family = await createFamilyForCurrentUser(name, companyName);
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("not-signed-in");
      skipNextRemoteSave.current = true;
      dispatch({ type: "HYDRATE", uid, familyUid: uid, role: "parent", family });
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
    () => ({ state, connection, dispatch, retrySync, checkReadiness, loadTaskLink, sendLinkUpdate, loadWorkerDay, sendDayUpdate, completeOnboarding, login, completeMissingAccount, registerChildSession, loginChildSession, registerSecondParentSession, logout, deleteAccount, uploadAttachment, describeUploadFailure: describeUploadError, maxUploadBytes: MAX_UPLOAD_BYTES, resetPassword }),
    [state, connection, retrySync, checkReadiness, loadTaskLink, sendLinkUpdate, loadWorkerDay, sendDayUpdate, completeOnboarding, login, completeMissingAccount, registerChildSession, loginChildSession, registerSecondParentSession, logout, deleteAccount, uploadAttachment, resetPassword]
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
