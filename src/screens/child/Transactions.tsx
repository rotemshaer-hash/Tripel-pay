import { Header } from "../../components/Header";
import { ChildBottomNav } from "../../components/BottomNav";
import { Money, EmptyState } from "../../components/UI";
import { useActiveChild } from "../../data/store";

export function ChildTransactions() {
  const child = useActiveChild();

  return (
    <div className="screen">
      <Header title="תנועות בחשבון שלי" subtitle={`יתרה: ${child.balance.toLocaleString("he-IL")}₪`} back tint="playful" />
      <div style={{ padding: "18px 20px 20px" }}>
        {child.transactions.length === 0 && <EmptyState text="עדיין אין כאן כלום — ברגע שתתחיל/י להרוויח ולהוציא, הכול יופיע כאן ✨" />}
        <div className="glass" style={{ borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)" }}>
          {child.transactions.map((tx, i) => (
            <div
              key={tx.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 16px",
                borderBottom: i === child.transactions.length - 1 ? "none" : "1px solid var(--line-soft)",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{tx.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>{tx.date}</div>
              </div>
              <Money value={tx.amount} />
            </div>
          ))}
        </div>
      </div>
      <ChildBottomNav />
    </div>
  );
}
