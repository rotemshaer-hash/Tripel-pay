import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { PrimaryButton } from "../../components/UI";

export function ChildrenDetails() {
  const count = Math.max(1, Math.min(6, Number(sessionStorage.getItem("tp-onboarding-kids") || "2")));
  const [names, setNames] = useState<string[]>(Array.from({ length: count }, () => ""));
  const navigate = useNavigate();

  function next() {
    sessionStorage.setItem("tp-onboarding-child-names", JSON.stringify(names));
    navigate("/onboarding/success");
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <Header title="פרטי ילדים" back />
      <div style={{ flex: 1, padding: "24px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{`שם ילד ${i + 1}`}</label>
            <input
              value={names[i]}
              onChange={(e) => setNames((arr) => arr.map((v, j) => (j === i ? e.target.value : v)))}
              style={{ padding: "13px 16px", borderRadius: 14, fontSize: 15 }}
            />
          </div>
        ))}

        <p style={{ fontSize: 13, color: "var(--ink-soft)", textAlign: "center", lineHeight: 1.6, marginTop: 8 }}>
          לאחר יצירת החשבון תקבלו לכל ילד קוד הזמנה וקישור אישי (במסך "הילדים שלי") שתוכלו לשלוח אליו בעצמכם — הוא ייכנס איתו ויירשם עם שם משתמש וסיסמה משלו
        </p>

        <div style={{ flex: 1 }} />
        <PrimaryButton onClick={next}>שליחה</PrimaryButton>
      </div>
    </div>
  );
}
