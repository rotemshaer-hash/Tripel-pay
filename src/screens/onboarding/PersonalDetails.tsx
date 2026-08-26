import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { PrimaryButton } from "../../components/UI";
import { MODE, V, work } from "../../data/vocabulary";
import { ProfessionPicker } from "../../components/ProfessionPicker";

/**
 * Step one of opening an account. The business build asks for the company as well as
 * the person, because everything the account produces — invites, exported journals —
 * has to say who it came from.
 */
export function PersonalDetails() {
  const isWork = MODE === "work";
  const [profession, setProfession] = useState(sessionStorage.getItem("tp-onboarding-profession") || "");
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canContinue = name.trim().length > 1 && emailValid && password.length >= 6 && (!isWork || company.trim().length > 1);

  function next() {
    sessionStorage.setItem("tp-onboarding-name", name.trim());
    sessionStorage.setItem("tp-onboarding-email", email.trim());
    sessionStorage.setItem("tp-onboarding-password", password);
    sessionStorage.setItem("tp-onboarding-company", company.trim());
    sessionStorage.setItem("tp-onboarding-profession", profession);
    navigate("/onboarding/children");
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <Header
        title={isWork ? "פתיחת חשבון לעסק" : "פרטים אישיים"}
        subtitle={isWork ? "שלב 1 מתוך 2" : undefined}
        back
        tall={false}
        tint={isWork ? "pro" : "playful"}
      />
      <div style={{ flex: 1, padding: "24px 20px", display: "flex", flexDirection: "column", gap: 18 }}>
        {isWork && (
          <Field label="שם העסק" hint="יופיע בהזמנות שתשלח לעובדים ובדוחות שתייצא">
            <input placeholder="לדוגמה: א.ב. שירותי ניקיון" value={company} onChange={(e) => setCompany(e.target.value)} style={fieldStyle(isWork)} />
          </Field>
        )}
        {isWork && (
          <Field label="התחום שלך" hint="לפי זה האפליקציה כבר תכיר את המשימות שאתה מחלק — אפשר לשנות בכל שלב">
            <ProfessionPicker value={profession} onChange={setProfession} />
          </Field>
        )}

        <Field label={isWork ? `שם ה${V.admin}` : "שם מלא"}>
          <input placeholder="שם מלא" value={name} onChange={(e) => setName(e.target.value)} style={fieldStyle(isWork)} />
        </Field>

        <Field label="אימייל" hint={isWork ? "זה יהיה שם המשתמש שלך לכניסה" : undefined}>
          <input
            type="email"
            dir="ltr"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ ...fieldStyle(isWork), textAlign: isWork ? "start" : "center" }}
          />
        </Field>

        <Field label="סיסמה">
          <input
            type="password"
            placeholder="לפחות 6 תווים"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={fieldStyle(isWork)}
          />
        </Field>

        <div style={{ flex: 1 }} />
        {isWork ? (
          <button
            onClick={next}
            disabled={!canContinue}
            style={{ width: "100%", padding: "15px", borderRadius: 11, border: "none", background: work.ink, color: "#ffffff", fontSize: 15, fontWeight: 800, opacity: canContinue ? 1 : 0.45 }}
          >
            המשך
          </button>
        ) : (
          <PrimaryButton onClick={next} disabled={!canContinue}>
            הבא
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12.5, color: "var(--ink-soft)", display: "block", marginBottom: 6, fontWeight: 700 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

const fieldStyle = (isWork: boolean): React.CSSProperties => ({
  width: "100%",
  padding: isWork ? "13px 14px" : "14px 16px",
  borderRadius: isWork ? 10 : 14,
  border: isWork ? "1px solid var(--line)" : undefined,
  fontSize: isWork ? 14.5 : 15,
});
