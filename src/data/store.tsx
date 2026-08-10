import { createContext, useContext, useEffect, useMemo, useRef, useReducer, type ReactNode } from "react";
import { seedFamily } from "./seed";
import { childrenList, normalizeFamily } from "./family";
import type { Child, ChildSettings, ExtraCard, Family, GiftBankItem, HouseRule, SavingsGoal, TaskCategory, TaskItem, TaskTemplate } from "./types";
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
} from "../firebase/auth";
import { auth } from "../firebase/config";
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
  | { type: "MARK_ARTICLE_READ"; childId: string; articleId: string }
  | { type: "ASSIGN_TASK"; childId: string; templateId: string }
  | { type: "ADVANCE_TASK"; childId: string; taskId: string }
  | { type: "APPROVE_TASK"; childId: string; taskId: string }
  | { type: "REDEEM_GIFT"; childId: string; giftId: string }
  | { type: "SEND_MONEY"; childId: string; amount: number; note: string }
  | { type: "WITHDRAW_CASH"; childId: string; amount: number; note: string }
  | { type: "CONTRIBUTE_SAVINGS"; childId: string; goalId: string; amount: number }
  | { type: "ADD_SAVINGS_GOAL"; childId: string; goal: SavingsGoal }
  | { type: "UPDATE_SETTINGS"; childId: string; patch: Partial<ChildSettings> }
  | { type: "ADD_AUTHORIZED_PERSON"; childId: string; name: string; relation: string }
  | { type: "ADD_HOUSE_RULE"; text: string }
  | { type: "REMOVE_HOUSE_RULE"; ruleId: string }
  | { type: "RESET_CHILD_PROGRESS"; childId: string }
  | { type: "ADD_EXTRA_CARD"; childId: string; name: string; category: ExtraCard["category"]; cost?: number; note?: string }
  | { type: "REMOVE_EXTRA_CARD"; childId: string; cardId: string }
  | { type: "ADD_TASK_TEMPLATE"; title: string; reward: number; category: TaskCategory }
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
    case "MARK_ARTICLE_READ":
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) =>
          c.readArticles.includes(action.articleId) ? c : { ...c, readArticles: [...c.readArticles, action.articleId] }
        ),
      };
    case "ASSIGN_TASK": {
      const template = state.family.taskBank.find((t) => t.id === action.templateId);
      if (!template) return state;
      const newTask: TaskItem = {
        id: `t-${crypto.randomUUID()}`,
        title: template.title,
        reward: template.reward,
        category: template.category,
        status: "available",
      };
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => ({ ...c, tasks: [newTask, ...c.tasks] })),
      };
    }
    case "ADVANCE_TASK": {
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => ({
          ...c,
          tasks: c.tasks.map((t) => {
            if (t.id !== action.taskId) return t;
            if (t.status === "available") return { ...t, status: "in_progress" };
            if (t.status === "in_progress") return { ...t, status: "pending_approval" };
            return t;
          }),
        })),
      };
    }
    case "APPROVE_TASK": {
      return {
        ...state,
        family: mapChild(state.family, action.childId, (c) => {
          const task = c.tasks.find((t) => t.id === action.taskId);
          if (!task) return c;
          return {
            ...c,
            balance: c.balance + task.reward,
            tasks: c.tasks.map((t) => (t.id === action.taskId ? { ...t, status: "completed", rewardRevealed: false } : t)),
            transactions: [{ id: `tx-${crypto.randomUUID()}`, title: task.title, amount: task.reward, date: "היום" }, ...c.transactions],
            achievements: {
              ...c.achievements,
              tasksCompletedCount: c.achievements.tasksCompletedCount + 1,
            },
          };
        }),
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
            redeemedGifts: [{ id: `rg-${crypto.randomUUID()}`, title: gift.title, category: gift.category, cost: gift.cost, date: "היום" }, ...c.redeemedGifts],
          };
        }),
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
  completeOnboarding: (email: string, password: string, name: string, childNames?: string[]) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  registerChildSession: (code: string, username: string, password: string) => Promise<void>;
  loginChildSession: (username: string, password: string) => Promise<void>;
  registerSecondParentSession: (code: string, email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
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

  const completeOnboarding = useMemo(
    () => async (email: string, password: string, name: string, childNames?: string[]) => {
      await registerParent(email, password, name, childNames);
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
  const resetPassword = useMemo(() => async (email: string) => resetParentPassword(email), []);

  const value = useMemo(
    () => ({ state, dispatch, completeOnboarding, login, registerChildSession, loginChildSession, registerSecondParentSession, logout, resetPassword }),
    [state, completeOnboarding, login, registerChildSession, loginChildSession, registerSecondParentSession, logout, resetPassword]
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
