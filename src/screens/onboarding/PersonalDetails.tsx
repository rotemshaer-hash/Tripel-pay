import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { PrimaryButton } from "../../components/UI";

export function PersonalDetails() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [kidsCount, setKidsCount] = useState("2");
  const navigate = useNavigate();

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  function next() {
    sessionStorage.setItem("tp-onboarding-name", name);
    sessionStorage.setItem("tp-onboarding-email", email.trim());
    sessionStorage.setItem("tp-onboarding-password", password);
    sessionStorage.setItem("tp-onboarding-kids", kidsCount);
    navigate("/onboarding/children");
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <Header title="פרטים אישיים" back tall={false} />
      <div style={{ flex: 1, padding: "24px 20px", display: "flex", flexDirection: "column", gap: 22 }}>
        <div>
          <label style={{ fontSize: 12.5, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>שם מלא</label>
          <input placeholder="פלוני אלמוני" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: "14px 16px", borderRadius: 14, fontSize: 15 }} />
        </div>

        <div>
          <label style={{ fontSize: 12.5, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>אימייל</label>
          <input
            type="email"
            dir="ltr"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "14px 16px", borderRadius: 14, fontSize: 15, textAlign: "center" }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12.5, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>סיסמה לחשבון</label>
          <input
            type="password"
            placeholder="לפחות 6 תווים"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "14px 16px", borderRadius: 14, fontSize: 15 }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12.5, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>מספר ילדים עבורם תרצו ארנק דיגיטלי</label>
          <input
            type="number"
            min={1}
            value={kidsCount}
            onChange={(e) => setKidsCount(e.target.value)}
            style={{ width: 90, padding: "14px 16px", borderRadius: 14, fontSize: 15, textAlign: "center" }}
          />
        </div>

        <div style={{ flex: 1 }} />
        <PrimaryButton onClick={next} disabled={!name.trim() || !emailValid || password.length < 6}>
          הבא
        </PrimaryButton>
      </div>
    </div>
  );
}
