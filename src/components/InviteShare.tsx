import { useStore } from "../data/store";
import { workerInviteLink } from "../data/routes";
import { V, work } from "../data/vocabulary";

/**
 * One invite, ready to send.
 *
 * Used both at the end of sign-up and from the team screen, so the manager sees the
 * same thing in both places and the message text has one definition. WhatsApp is
 * first because that is how a small business actually reaches its people; copying the
 * link is the fallback that always works, including on a desktop browser.
 */
export function InviteShare({
  workerName,
  code,
  onNotify,
  compact,
}: {
  workerName: string;
  code: string;
  onNotify: (message: string) => void;
  compact?: boolean;
}) {
  const { state } = useStore();
  const company = state.family.companyName || state.family.parentName;
  const link = workerInviteLink(code);
  const message = `היי ${workerName}, צורפת לצוות של ${company} ב-${V.appName}.\nנכנסים לקישור ונרשמים עם שם משתמש וסיסמה משלך:\n${link}\n\nקוד ההצטרפות שלך: ${code}`;

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      onNotify(label);
    } catch {
      onNotify("לא ניתן להעתיק — יש להעתיק ידנית");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {!compact && (
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", lineHeight: 1.5 }}>
          {`שלח ל${workerName} את הקישור — הוא נרשם עם שם משתמש וסיסמה משלו, ורואה רק את המשימות שלו.`}
        </div>
      )}

      <div
        dir="ltr"
        onClick={() => copy(link, "הקישור הועתק")}
        style={{
          fontSize: 11,
          background: "var(--paper)",
          border: "1px solid var(--line)",
          borderRadius: 8,
          padding: "8px 10px",
          color: "var(--ink-soft)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          cursor: "pointer",
        }}
      >
        {link}
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#1f9e5a",
            color: "#ffffff",
            borderRadius: 9,
            padding: "10px 8px",
            fontSize: 12.5,
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          שליחה בוואטסאפ
        </a>
        <button
          onClick={() => copy(message, "ההודעה הועתקה")}
          style={{ flex: 1, background: "#ffffff", border: "1px solid var(--line)", borderRadius: 9, padding: "10px 8px", fontSize: 12.5, fontWeight: 700, color: "var(--ink)" }}
        >
          העתקת ההודעה
        </button>
      </div>

      <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>
        קוד הצטרפות: <span dir="ltr" style={{ fontWeight: 800, letterSpacing: "0.05em", color: work.ink }}>{code}</span>
      </div>
    </div>
  );
}
