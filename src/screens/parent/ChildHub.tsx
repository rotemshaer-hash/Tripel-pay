import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { ParentBottomNav } from "../../components/BottomNav";
import { SendMoneyFab } from "../../components/SendMoneyFab";
import { NavPill } from "../../components/NavPill";
import { ChildCarousel } from "../../components/ChildSwitcher";
import { IconPeopleCoin, IconPiggyBank, IconMountain, IconCardCheck, IconGraduationCap, IconChecklist } from "../../components/Icons";
import { Toast, useToast } from "../../components/Toast";
import { useActiveChild, useStore } from "../../data/store";
import { childrenList } from "../../data/family";
import type { Child } from "../../data/types";
import { V } from "../../data/vocabulary";

function ChildInviteCard({ child, parentName, showToast }: { child: Child; parentName: string; showToast: (msg: string) => void }) {
  const link = `${window.location.origin}${window.location.pathname}#/child-register?code=${child.inviteCode}`;
  const mailBody = `היי ${child.name}! ${parentName || "אנחנו"} הצטרפנו ל-${V.appName}. תיכנס/י לקישור ותירשם/י עם שם משתמש וסיסמה משלך:\n${link}\n\nקוד ההזמנה שלך: ${child.inviteCode}`;
  const mailtoHref = `mailto:?subject=${encodeURIComponent(`הזמנה ל-${V.appName}`)}&body=${encodeURIComponent(mailBody)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      showToast("הקישור הועתק");
    } catch {
      showToast("לא ניתן להעתיק — נסו להעתיק ידנית");
    }
  }

  return (
    <div className="glass" style={{ margin: "12px 20px 0", borderRadius: "var(--radius-sm)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{`הזמנת ${child.name} לחשבון משלו/משלה`}</div>
      <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5 }}>
        שלחו את הקישור לילד/ה בעצמכם (וואטסאפ, מייל, איך שנוח) — הוא/היא ייכנס/תיכנס ותירשם/תרשם עם שם משתמש וסיסמה אישיים.
      </div>
      <div
        dir="ltr"
        style={{
          fontSize: 12,
          background: "var(--violet-200)",
          color: "var(--violet-700)",
          borderRadius: 10,
          padding: "8px 10px",
          fontWeight: 700,
          textAlign: "center",
          letterSpacing: "0.05em",
        }}
      >
        {child.inviteCode}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={copyLink}
          style={{ flex: 1, background: "var(--teal-700)", color: "#ffffff", border: "none", borderRadius: 999, padding: "10px 12px", fontSize: 12.5, fontWeight: 700 }}
        >
          העתקת קישור
        </button>
        <a
          href={mailtoHref}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--violet-700)",
            color: "#fff",
            borderRadius: 999,
            padding: "10px 12px",
            fontSize: 12.5,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          שליחה במייל
        </a>
      </div>
    </div>
  );
}

export function ChildHub() {
  const { state, dispatch } = useStore();
  const child = useActiveChild();
  const navigate = useNavigate();
  const { toastMessage, showToast } = useToast();

  const links = [
    { label: "הגדרות", icon: <IconPeopleCoin size={22} />, to: "/parent/settings", gradient: "var(--grad-violet)", accent: "#4b2e83" },
    { label: "חסכונות", icon: <IconPiggyBank size={22} />, to: "/parent/savings", gradient: "linear-gradient(140deg, #37d3b8 0%, #1f9e8a 100%)", accent: "#1f9e8a" },
    { label: "מטלות", icon: <IconMountain size={22} />, to: "/parent/child-tasks", gradient: "var(--grad-teal)", accent: "#e0224a" },
    { label: "תנועות", icon: <IconCardCheck size={22} />, to: "/parent/transactions", gradient: "linear-gradient(140deg, #ffb347 0%, #f2761b 100%)", accent: "#f2761b" },
    { label: "הישגים", icon: <IconGraduationCap size={22} />, to: "/parent/achievements", gradient: "linear-gradient(140deg, #c65cc9 0%, #8a2fb0 100%)", accent: "#8a2fb0" },
  ];

  return (
    <div className="screen">
      <Header title="הילדים שלי" back tint="playful" />

      <ChildCarousel children={childrenList(state.family)} activeId={child.id} onSelect={(id) => dispatch({ type: "SET_ACTIVE_CHILD", childId: id })} />

      {!child.authUid && <ChildInviteCard child={child} parentName={state.family.parentName} showToast={showToast} />}

      <div style={{ padding: "16px 20px 0" }}>
        <button
          onClick={() => navigate("/parent/house-rules")}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderRadius: "var(--radius-sm)",
            padding: "12px 16px",
            border: "1px dashed var(--violet-700)",
            background: "var(--violet-200)",
            color: "var(--violet-700)",
          }}
        >
          <IconChecklist size={20} />
          <span style={{ fontSize: 13.5, fontWeight: 700, flex: 1, textAlign: "start" }}>כללי הבית שלנו — לכל המשפחה</span>
          <span style={{ fontSize: 16 }}>‹</span>
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "22px 20px" }}>
        {links.map((l) => (
          <NavPill key={l.to} label={l.label} icon={l.icon} gradient={l.gradient} accent={l.accent} onClick={() => navigate(l.to)} />
        ))}
      </div>

      <Toast message={toastMessage} />
      <SendMoneyFab childId={child.id} />
      <ParentBottomNav />
    </div>
  );
}
