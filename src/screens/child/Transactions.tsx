import { Header } from "../../components/Header";
import { ChildBottomNav } from "../../components/BottomNav";
import { EmptyState } from "../../components/UI";
import { TransactionRow } from "../../components/TransactionRow";
import { useActiveChild } from "../../data/store";

export function ChildTransactions() {
  const child = useActiveChild();

  return (
    <div className="screen">
      <Header title="תנועות בחשבון שלי" subtitle={`יתרה: ${child.balance.toLocaleString("he-IL")}₪`} back tint="playful" />
      <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {child.transactions.length === 0 && <EmptyState text="עדיין אין כאן כלום — ברגע שתתחיל/י להרוויח ולהוציא, הכול יופיע כאן ✨" />}
        {child.transactions.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </div>
      <ChildBottomNav />
    </div>
  );
}
