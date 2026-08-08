import type { ReactNode } from "react";
import { IconReceipt, IconPeopleCoin, IconGift, IconCardCheck } from "../components/Icons";
import type { ExtraCard } from "./types";

export const cardIcons: Record<ExtraCard["category"], ReactNode> = {
  subscription: <IconReceipt size={24} />,
  membership: <IconPeopleCoin size={24} />,
  gift: <IconGift size={24} />,
  other: <IconCardCheck size={24} />,
};

export const categoryLabels: Record<ExtraCard["category"], string> = {
  subscription: "מנוי",
  membership: "חברות מועדון",
  gift: "כרטיס מתנה",
  other: "אחר",
};

export const categoryCardColor: Record<ExtraCard["category"], string> = {
  subscription: "var(--teal-700)",
  membership: "var(--violet-700)",
  gift: "var(--coral-600)",
  other: "var(--ink-soft)",
};
