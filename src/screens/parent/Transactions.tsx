import { Header } from "../../components/Header";
import { ParentBottomNav } from "../../components/BottomNav";
import { SendMoneyFab } from "../../components/SendMoneyFab";
import { EmptyState } from "../../components/UI";
import { DonutChart, type DonutSlice } from "../../components/DonutChart";
import { TransactionRow } from "../../components/TransactionRow";
import { useActiveChild } from "../../data/store";

const SLICE_COLORS = ["var(--teal-700)", "var(--violet-700)", "var(--amber-600)", "var(--coral-600)"];

export function ParentTransactions() {
  const child = useActiveChild();

  const income = child.transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const expense = child.transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const grouped = Object.entries(
    child.transactions
      .filter((t) => t.amount < 0)
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.title] = (acc[t.title] ?? 0) + Math.abs(t.amount);
        return acc;
      }, {})
  ).sort((a, b) => b[1] - a[1]);
  const topSlices = grouped.slice(0, 4);
  const restSum = grouped.slice(4).reduce((sum, [, v]) => sum + v, 0);
  const slices: DonutSlice[] = topSlices.map(([label, value], i) => ({ label, value, color: SLICE_COLORS[i] }));
  if (restSum > 0) slices.push({ label: "אחר", value: restSum, color: "var(--ink-faint)" });

  return (
    <div className="screen">
      <Header title={`תנועות בחשבון של ${child.name}`} back tint="playful">
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <div style={{ textAlign: "center" }}>
            <div className="money" style={{ fontSize: 20 }}>+{income.toLocaleString("he-IL")}₪</div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>סך הכנסות</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div className="money" style={{ fontSize: 20 }}>-{expense.toLocaleString("he-IL")}₪</div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>סך הוצאות</div>
          </div>
        </div>
      </Header>

      {slices.length > 0 && (
        <div style={{ margin: "18px 20px 0", padding: 18, borderRadius: "var(--radius-lg)" }} className="glass">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>לאן הלך הכסף</div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <DonutChart slices={slices} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {slices.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
                  <span style={{ fontSize: 12, color: "var(--ink-faint)", flexShrink: 0 }}>{Math.round((s.value / expense) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {child.transactions.length === 0 && <EmptyState text="אין תנועות עדיין" />}
        {child.transactions.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </div>
      <SendMoneyFab childId={child.id} />
      <ParentBottomNav />
    </div>
  );
}
