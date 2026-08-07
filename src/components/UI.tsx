import type { ReactNode } from "react";
import type { TaskCategory } from "../data/types";
import { IconBroom, IconDishes, IconGraduationCap, IconPiggyBank, IconMountain } from "./Icons";

export function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "16px",
        borderRadius: 999,
        border: "none",
        background: disabled ? "rgba(15,33,29,0.08)" : "var(--teal-700)",
        color: disabled ? "var(--ink-faint)" : "#ffffff",
        fontSize: 16,
        fontWeight: 800,
        boxShadow: disabled ? "none" : "var(--glow-teal)",
      }}
    >
      {children}
    </button>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      className="glass"
      style={{
        borderRadius: "var(--radius-md)",
        padding: 16,
        boxShadow: "var(--shadow-card)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "26px 20px 12px" }}>
      <h2 style={{ fontSize: 14, fontWeight: 800, margin: 0, letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--teal-700)", boxShadow: "var(--glow-teal)", flexShrink: 0 }} />
        {children}
      </h2>
      {action}
    </div>
  );
}

export function ProgressBar({ value, max, color = "var(--teal-500)" }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div style={{ height: 9, borderRadius: 999, background: "rgba(15,33,29,0.06)", overflow: "hidden" }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${color}, var(--violet-500))`,
          borderRadius: 999,
          transition: "width 0.4s cubic-bezier(.22,1,.36,1)",
          boxShadow: `0 0 10px ${color}`,
        }}
      />
    </div>
  );
}

export function ProgressRing({ pct, size = 92, color = "var(--teal-500)", label }: { pct: number; size?: number; color?: string; label: string }) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const gradId = `ring-${label.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", overflow: "visible" }}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="var(--violet-500)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(15,33,29,0.06)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(.22,1,.36,1)", filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 18, fontWeight: 800 }}>{pct}%</span>
      </div>
      <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--ink-soft)", marginTop: 8, maxWidth: size + 10 }}>{label}</div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        width: 46,
        height: 27,
        borderRadius: 999,
        border: "1px solid " + (checked ? "transparent" : "var(--line)"),
        background: checked ? "var(--violet-700)" : "rgba(15,33,29,0.08)",
        boxShadow: checked ? "var(--glow-violet)" : "none",
        position: "relative",
        flexShrink: 0,
        transition: "background 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          insetInlineStart: checked ? 22 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
          transition: "inset-inline-start 0.2s cubic-bezier(.22,1,.36,1)",
        }}
      />
    </button>
  );
}

const categoryIcons: Record<TaskCategory, ReactNode> = {
  cleaning: <IconBroom size={22} />,
  dishes: <IconDishes size={22} />,
  finance: <IconGraduationCap size={22} />,
  savings: <IconPiggyBank size={22} />,
  other: <IconMountain size={22} />,
};

export function categoryIcon(cat: TaskCategory) {
  return categoryIcons[cat] ?? <IconMountain size={22} />;
}

const categoryChipColor: Record<TaskCategory, string> = {
  cleaning: "var(--teal-700)",
  dishes: "var(--amber-600)",
  finance: "var(--violet-700)",
  savings: "var(--coral-600)",
  other: "var(--violet-500)",
};

export function categoryTileColor(cat: TaskCategory) {
  return categoryChipColor[cat] ?? "var(--violet-500)";
}

export function CategoryIconChip({ cat, size = 42 }: { cat: TaskCategory; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: categoryChipColor[cat] ?? "var(--violet-500)",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {categoryIcon(cat)}
    </div>
  );
}

export const taskCategoryLabels: Record<TaskCategory, string> = {
  cleaning: "ניקיון",
  dishes: "כלים",
  finance: "פיננסי",
  savings: "חיסכון",
  other: "אחר",
};

export function Money({ value, sign = true }: { value: number; sign?: boolean }) {
  const positive = value >= 0;
  return (
    <span
      className="money"
      style={{ color: sign ? (positive ? "var(--teal-900)" : "var(--coral-600)") : "inherit", fontWeight: 700 }}
    >
      {sign && positive ? "+" : ""}
      {value.toLocaleString("he-IL")}₪
    </span>
  );
}

export function EmptyState({ text, actionLabel, onAction }: { text: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div style={{ textAlign: "center", color: "var(--ink-faint)", fontSize: 13.5, padding: "28px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <span>{text}</span>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            background: "var(--violet-700)",
            color: "#ffffff",
            border: "none",
            borderRadius: 999,
            padding: "9px 18px",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "var(--glow-violet)",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
