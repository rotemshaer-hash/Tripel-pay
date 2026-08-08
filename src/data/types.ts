export type TaskCategory = "cleaning" | "dishes" | "finance" | "savings" | "other";

export interface TaskItem {
  id: string;
  title: string;
  reward: number;
  category: TaskCategory;
  status: "available" | "in_progress" | "pending_approval" | "completed";
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

export interface CourseTopic {
  id: string;
  title: string;
  icon: string;
  progress: number;
  stage: 1 | 2 | 3;
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
}

export interface ExtraCard {
  id: string;
  name: string;
  category: "subscription" | "membership" | "gift" | "other";
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
  courses: CourseTopic[];
  strengths: StrengthTopic[];
  redeemedGifts: RedeemedGift[];
  extraCards: ExtraCard[];
  settings: ChildSettings;
  achievements: {
    lessonsProgress: number;
    savingsPaidProgress: number;
    favoriteTask: string;
    tasksCompletedCount: number;
    totalTaskReward: number;
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
