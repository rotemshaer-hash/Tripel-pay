import { useMemo, useState, type ReactNode } from "react";
import { Header } from "../../components/Header";
import { ParentBottomNav } from "../../components/BottomNav";
import { SendMoneyFab } from "../../components/SendMoneyFab";
import { SectionTitle, Money } from "../../components/UI";
import { Toast, useToast } from "../../components/Toast";
import { IconPlaneTicket, IconTicket, IconFood, IconScooter, IconToy } from "../../components/Icons";
import { useActiveChild, useStore } from "../../data/store";
import type { GiftBankItem } from "../../data/types";

export const giftIcons: Record<GiftBankItem["category"], ReactNode> = {
  flight: <IconPlaneTicket size={28} />,
  ticket: <IconTicket size={28} />,
  food: <IconFood size={28} />,
  gadget: <IconScooter size={28} />,
  toy: <IconToy size={28} />,
};

export const categoryLabels: Record<GiftBankItem["category"], string> = {
  flight: "טיסות",
  ticket: "כרטיסים",
  food: "אוכל",
  gadget: "גאדג'טים",
  toy: "צעצועים",
};

const giftChipColor: Record<GiftBankItem["category"], string> = {
  flight: "var(--violet-700)",
  ticket: "var(--teal-700)",
  food: "var(--amber-600)",
  gadget: "var(--violet-500)",
  toy: "var(--coral-600)",
};

export function GiftBank() {
  const { state, dispatch } = useStore();
  const child = useActiveChild();
  const { toastMessage, showToast } = useToast();
  const [filter, setFilter] = useState<GiftBankItem["category"] | "all">("all");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [cost, setCost] = useState("50");
  const [category, setCategory] = useState<GiftBankItem["category"]>("toy");

  function addGift() {
    const costNum = Number(cost);
    if (!title.trim() || !costNum) return;
    dispatch({ type: "ADD_GIFT", title: title.trim(), cost: costNum, category });
    setTitle("");
    setCost("50");
    setCategory("toy");
    setAdding(false);
  }

  const categories = useMemo(() => Array.from(new Set(state.family.giftBank.map((g) => g.category))), [state.family.giftBank]);

  const items = useMemo(() => {
    const filtered = filter === "all" ? state.family.giftBank : state.family.giftBank.filter((g) => g.category === filter);
    return [...filtered].sort((a, b) => {
      const aAfford = child.balance >= a.cost;
      const bAfford = child.balance >= b.cost;
      if (aAfford !== bAfford) return aAfford ? -1 : 1;
      return a.cost - b.cost;
    });
  }, [state.family.giftBank, filter, child.balance]);

  function redeem(gift: GiftBankItem) {
    if (confirmingId !== gift.id) {
      setConfirmingId(gift.id);
      return;
    }
    dispatch({ type: "REDEEM_GIFT", childId: child.id, giftId: gift.id });
    showToast(`${gift.title} מומש בהצלחה!`);
    setConfirmingId(null);
  }

  return (
    <div className="screen">
      <Header title="מאגר המתנות" subtitle={`יתרת ${child.name}: ${child.balance.toLocaleString("he-IL")}₪`} back />

      <div style={{ display: "flex", gap: 8, padding: "18px 20px 4px", overflowX: "auto" }}>
        <button
          onClick={() => setFilter("all")}
          style={{
            flexShrink: 0,
            padding: "7px 14px",
            borderRadius: 999,
            fontSize: 12.5,
            fontWeight: 700,
            border: filter === "all" ? "none" : "1px solid var(--line)",
            background: filter === "all" ? "var(--violet-700)" : "transparent",
            color: filter === "all" ? "#fff" : "var(--ink-soft)",
          }}
        >
          הכל
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              flexShrink: 0,
              padding: "7px 14px",
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 700,
              border: filter === cat ? "none" : "1px solid var(--line)",
              background: filter === cat ? "var(--violet-700)" : "transparent",
              color: filter === cat ? "#fff" : "var(--ink-soft)",
            }}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      <SectionTitle
        action={
          <button onClick={() => setAdding((v) => !v)} style={{ background: "none", border: "none", color: "var(--violet-700)", fontSize: 13, fontWeight: 700 }}>
            {adding ? "ביטול" : "+ הוספת מתנה"}
          </button>
        }
      >
        מימוש בסריקת QR בחנות
      </SectionTitle>

      {adding && (
        <div style={{ padding: "0 20px 16px" }}>
          <div className="glass" style={{ borderRadius: "var(--radius-sm)", padding: 14 }}>
            <label style={{ fontSize: 12, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>שם המתנה</label>
            <input
              placeholder="למשל: כרטיס לפארק שעשועים"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14, marginBottom: 10 }}
            />
            <label style={{ fontSize: 12, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>עלות (₪)</label>
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14, marginBottom: 10 }}
            />
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {(Object.keys(categoryLabels) as GiftBankItem["category"][]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: category === cat ? "2px solid var(--teal-500)" : "1px solid var(--line)",
                    background: category === cat ? "var(--teal-100)" : "transparent",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>
            <button
              onClick={addGift}
              disabled={!title.trim() || !Number(cost)}
              style={{
                width: "100%",
                background: "var(--teal-700)",
                color: "#ffffff",
                border: "none",
                borderRadius: 10,
                padding: "10px",
                fontSize: 13.5,
                fontWeight: 700,
                opacity: title.trim() && Number(cost) ? 1 : 0.5,
              }}
            >
              שמירה
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 20px 20px" }}>
        {items.map((g) => {
          const affordable = child.balance >= g.cost;
          const gap = g.cost - child.balance;
          const confirming = confirmingId === g.id;
          const blocked = child.settings.frozen || g.cost > child.settings.paymentLimit;
          return (
            <div
              key={g.id}
              className="glass"
              style={{
                borderRadius: "var(--radius-md)",
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                boxShadow: "var(--shadow-card)",
                position: "relative",
              }}
            >
              <button
                onClick={() => dispatch({ type: "REMOVE_GIFT", giftId: g.id })}
                aria-label="הסרת מתנה"
                style={{ position: "absolute", top: 8, insetInlineEnd: 8, background: "none", border: "none", color: "var(--ink-faint)", fontSize: 14 }}
              >
                ✕
              </button>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: giftChipColor[g.category],
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {giftIcons[g.category]}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.3, minHeight: 34 }}>{g.title}</div>
              <Money value={g.cost} sign={false} />
              <button
                disabled={!affordable || blocked}
                onClick={() => redeem(g)}
                style={{
                  marginTop: 4,
                  background: !affordable || blocked ? "rgba(15,33,29,0.08)" : confirming ? "var(--violet-700)" : "var(--teal-700)",
                  color: !affordable || blocked ? "var(--ink-faint)" : "#ffffff",
                  boxShadow: !affordable || blocked ? "none" : confirming ? "var(--glow-violet)" : "var(--glow-teal)",
                  border: "none",
                  borderRadius: 999,
                  padding: "8px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: !affordable || blocked ? "not-allowed" : "pointer",
                }}
              >
                {child.settings.frozen ? "הכרטיס מוקפא" : !affordable ? `עוד ${gap.toLocaleString("he-IL")}₪ ואפשר!` : blocked ? "מעל הגבלת התשלום" : confirming ? "לאשר מימוש?" : "מימוש"}
              </button>
            </div>
          );
        })}
      </div>
      <Toast message={toastMessage} />
      <SendMoneyFab childId={child.id} />
      <ParentBottomNav />
    </div>
  );
}
