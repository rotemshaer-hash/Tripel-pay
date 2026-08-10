import type { Child, Family, GiftBankItem, TaskTemplate } from "./types";
import { genInviteCode, slugifyId } from "./family";

const taskBank: TaskTemplate[] = [
  { id: "tb-1", title: "לימוד פיננסי - 15 דק'", reward: 15, category: "finance" },
  { id: "tb-2", title: "לשטוף כלים", reward: 12, category: "dishes" },
  { id: "tb-3", title: "לסדר את השולחן", reward: 8, category: "dishes" },
  { id: "tb-4", title: "לנקות את החדר", reward: 20, category: "cleaning" },
  { id: "tb-5", title: "להוציא את הזבל", reward: 6, category: "cleaning" },
  { id: "tb-6", title: "להפקיד לחיסכון", reward: 10, category: "savings" },
  { id: "tb-7", title: "לסדר את המיטה", reward: 5, category: "cleaning" },
  { id: "tb-8", title: "לעזור בשיעורי בית", reward: 14, category: "other" },
];

const giftBank: GiftBankItem[] = [
  { id: "gb-1", title: "טיסה ליורודיסני", cost: 3200, category: "flight" },
  { id: "gb-2", title: "טיסה ליוון", cost: 2600, category: "flight" },
  { id: "gb-3", title: "כרטיס לכדורגל", cost: 180, category: "ticket" },
  { id: "gb-4", title: "כרטיס לסרט", cost: 45, category: "ticket" },
  { id: "gb-5", title: "קורקינט חשמלי", cost: 950, category: "gadget" },
  { id: "gb-6", title: "ארוחה בארומה", cost: 60, category: "food" },
  { id: "gb-7", title: "ארוחה במקדונלדס", cost: 45, category: "food" },
];

const houseRules = [
  { id: "hr-1", text: "לפני שיוצאים לשחק, המיטה מסודרת והחדר נקי" },
  { id: "hr-2", text: "שיעורי בית קודם, מסך אחר כך" },
  { id: "hr-3", text: "מי שמלכלך בכלים - שוטף אותם בעצמו" },
  { id: "hr-4", text: "אפשר לבקש הקדמה מהחיסכון, אבל תמיד עם אישור" },
];

const blankAvatarColors = ["var(--violet-500)", "var(--teal-500)", "var(--coral-500)", "var(--violet-700)"];

function blankChild(name: string, colorIndex: number): Child {
  return {
    id: "",
    name,
    avatarColor: blankAvatarColors[colorIndex % blankAvatarColors.length],
    initial: name.trim().charAt(0) || "?",
    balance: 0,
    savingsTotal: 0,
    inviteCode: "",
    tasks: [],
    transactions: [],
    savingsGoals: [],
    savingsHistory: [],
    readArticles: [],
    strengths: [],
    redeemedGifts: [],
    extraCards: [],
    settings: {
      thirdPartyTransfersEnabled: false,
      transferNotifications: true,
      authorizedPeople: [],
      savingsBreakNotify: true,
      savingsBreakRequiresApproval: true,
      weeklyAllowance: 0,
    },
    achievements: {
      lessonsProgress: 0,
      savingsPaidProgress: 0,
      favoriteTask: "",
      tasksCompletedCount: 0,
      totalTaskReward: 0,
      consistencyStreakWeeks: 0,
    },
  };
}

/** Builds one real child at `index` — every new child starts at zero balance/savings
 * with no tasks, transactions, or history, regardless of position. */
function templateChild(index: number, name: string): Child {
  const trimmed = name.trim();
  const base = blankChild(trimmed, index);
  return {
    ...base,
    id: slugifyId(trimmed, `child-${index + 1}`),
    inviteCode: genInviteCode(),
  };
}

export function seedFamily(parentName: string, parentEmail: string, childNames?: string[]): Family {
  const names = childNames && childNames.length > 0 ? childNames.map((n, i) => (n.trim() ? n : `ילד/ה ${i + 1}`)) : ["ילד/ה 1"];
  const kids = names.map((n, i) => templateChild(i, n));
  return {
    parentName: parentName || "דנה",
    parentEmail,
    parentInviteCode: genInviteCode(),
    children: Object.fromEntries(kids.map((c) => [c.id, c])),
    childOrder: kids.map((c) => c.id),
    taskBank,
    giftBank,
    houseRules,
  };
}
