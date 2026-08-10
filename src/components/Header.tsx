import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../data/store";
import { IconParentUser, IconChildUser } from "./Icons";
import { SurrealBackdrop } from "./SurrealBackdrop";

const MELT_CLIP = "polygon(0 0, 100% 0, 100% 88%, 94% 100%, 84% 86%, 74% 100%, 62% 84%, 50% 100%, 38% 84%, 26% 100%, 14% 86%, 6% 100%, 0 88%)";

function RoleSwitcher() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  // A real child login has no parent view to preview — this pill is only the parent's
  // own convenience toggle for checking what their kid's screen looks like.
  if (state.role === "child" || !state.onboarded || location.pathname.startsWith("/onboarding") || location.pathname === "/login") return null;

  function go(mode: "parent" | "child") {
    dispatch({ type: "SET_VIEW_MODE", mode });
    navigate(`/${mode}`);
  }

  return (
    <div className="role-switcher" style={{ flexShrink: 0 }}>
      <button
        className={state.viewMode === "parent" ? "active" : ""}
        onClick={() => go("parent")}
        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        <IconParentUser size={13} strokeWidth={2.2} /> הורה
      </button>
      <button
        className={state.viewMode === "child" ? "active" : ""}
        onClick={() => go("child")}
        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        <IconChildUser size={13} strokeWidth={2.2} /> ילד
      </button>
    </div>
  );
}

export function Header({
  title,
  subtitle,
  back,
  right,
  tall,
  tint = "red",
  children,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  tall?: boolean;
  tint?: "red" | "purple" | "transparent" | "playful";
  children?: ReactNode;
}) {
  const navigate = useNavigate();
  const playful = tint === "playful";
  return (
    <header
      className={playful ? "dream-sky" : undefined}
      style={{
        background: playful
          ? "linear-gradient(120deg, var(--header-gradient) 0%, var(--violet-700) 45%, var(--amber-600) 75%, var(--header-gradient) 100%)"
          : tint === "transparent"
            ? "none"
            : tint === "purple"
              ? "var(--violet-700)"
              : "var(--header-gradient)",
        color: "#fff",
        padding: tall ? "20px 20px 34px" : playful ? "16px 20px 32px" : "16px 20px 20px",
        borderRadius: 0,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        flexShrink: 0,
        position: "relative",
        overflow: playful ? "hidden" : undefined,
        clipPath: playful ? MELT_CLIP : undefined,
      }}
    >
      {playful && <SurrealBackdrop />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
          {back && (
            <button
              onClick={() => navigate(-1)}
              aria-label="חזרה"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.35)",
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(6px)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              ›
            </button>
          )}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </div>
            {subtitle && <div style={{ fontSize: 12.5, opacity: 0.8, marginTop: 3 }}>{subtitle}</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {right}
          <RoleSwitcher />
        </div>
      </div>
      {children && (
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      )}
    </header>
  );
}
