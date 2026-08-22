export type TaskCategory = "cleaning" | "dishes" | "finance" | "savings" | "other";

/** How often a fixed task repeats. "none" = a one-off (variable) task. */
export type RecurrenceRule = "none" | "daily" | "weekly" | "monthly";

export type TaskPriority = "low" | "normal" | "high" | "urgent";

/** A file, photo or written note hung off a task — either as part of the brief
 * (attached by the manager) or as evidence of completion (attached by the worker).
 * Images are held as compressed data URLs; `note` carries plain text in `content`. */
export interface Attachment {
  id: string;
  kind: "image" | "file" | "note";
  name: string;
  /** data URL for image/file, or the raw text for a note */
  content: string;
  addedAt: string;
  addedBy: string;
}

/** One immutable line in a task's audit trail — who did what, when. This is the
 * record that email/WhatsApp can't give you, so entries are only ever appended. */
export interface ActivityEntry {
  id: string;
  at: string;
  by: string;
  action: "created" | "assigned" | "started" | "submitted" | "approved" | "reopened" | "commented" | "attached";
  detail?: string;
}

export interface TaskComment {
  id: string;
  at: string;
  by: string;
  text: string;
}

export interface TaskItem {
  id: string;
  title: string;
  reward: number;
  category: TaskCategory;
  status: "available" | "in_progress" | "pending_approval" | "completed";
  // --- work-journal fields (all optional so existing records stay valid) ---
  /** Free-text brief from the manager. */
  brief?: string;
  createdAt?: string;
  dueAt?: string;
  startedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  priority?: TaskPriority;
  recurrence?: RecurrenceRule;
  /** Customer / site / project this task belongs to — drives billing proof and filtering. */
  site?: string;
  /** Instructions and reference files attached by the manager. */
  briefAttachments?: Attachment[];
  /** Evidence attached by the worker after doing the job. */
  proofs?: Attachment[];
  activity?: ActivityEntry[];
  comments?: TaskComment[];
  /** Set false the moment a parent approves the task, then flipped to true once the
   * child taps through the reward-reveal card — lets the child screen show the reveal
   * exactly once, even across reloads, instead of tracking it in throwaway UI state. */
  rewardRevealed?: boolean;
  /** Sibling child id this task has been offered to for a trade; cleared (key removed,
   * never set to undefined — Firebase's set() rejects undefined values) on approval or
   * cancellation. */
  tradeOfferedTo?: string;
}

export interface TaskTemplate {
  id: string;
  title: string;
  reward: number;
  category: TaskCategory;
}

export interface TransactionItem {
  id: string;
  title: string;
  amount: number;
  date: string;
  location?: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  note?: string;
}

export interface GiftBankItem {
  id: string;
  title: string;
  cost: number;
  category: "flight" | "ticket" | "food" | "gadget" | "toy";
}

export interface AuthorizedPerson {
  id: string;
  name: string;
  relation: string;
}

export interface ChildSettings {
  thirdPartyTransfersEnabled: boolean;
  transferNotifications: boolean;
  authorizedPeople: AuthorizedPerson[];
  savingsBreakNotify: boolean;
  savingsBreakRequiresApproval: boolean;
  weeklyAllowance: number;
}

export interface StrengthTopic {
  id: string;
  title: string;
  level: "strength" | "difficulty";
}

export interface RedeemedGift {
  id: string;
  title: string;
  category: GiftBankItem["category"];
  cost: number;
  date: string;
  /** A redeemed reward starts unfulfilled; the parent later provides the real reward
   * (e.g. buys the gift card) and attaches its code, which the child then sees. */
  fulfilled?: boolean;
  code?: string;
}

export interface ExtraCard {
  id: string;
  name: string;
  category: "subscription" | "membership" | "gift" | "other";
  cost?: number;
  note?: string;
}

export interface Child {
  id: string;
  name: string;
  avatarColor: string;
  initial: string;
  photoUrl?: string;
  balance: number;
  savingsTotal: number;
  inviteCode: string;
  authUid?: string;
  tasks: TaskItem[];
  transactions: TransactionItem[];
  savingsGoals: SavingsGoal[];
  savingsHistory: SavingsGoal[];
  readArticles: string[];
  strengths: StrengthTopic[];
  redeemedGifts: RedeemedGift[];
  extraCards: ExtraCard[];
  /** ISO timestamp of the last weekly-allowance payout; used to auto-credit the
   * recurring allowance one week at a time. Absent until the allowance first runs. */
  lastAllowancePaidAt?: string;
  settings: ChildSettings;
  achievements: {
    lessonsProgress: number;
    savingsPaidProgress: number;
    favoriteTask: string;
    tasksCompletedCount: number;
    consistencyStreakWeeks: number;
  };
}

export interface HouseRule {
  id: string;
  text: string;
}

export interface Family {
  parentName: string;
  parentEmail: string;
  secondParentName?: string;
  secondParentAuthUid?: string;
  parentInviteCode: string;
  children: Record<string, Child>;
  childOrder: string[];
  taskBank: TaskTemplate[];
  giftBank: GiftBankItem[];
  houseRules: HouseRule[];
}
