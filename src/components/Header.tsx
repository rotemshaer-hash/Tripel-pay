import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../data/store";
import { homePath } from "../data/routes";
import { V, work } from "../data/vocabulary";
import { IconParentUser, IconChildUser } from "./Icons";
import { SurrealBackdrop } from "./SurrealBackdrop";

const MELT_CLIP = "polygon(0 0, 100% 0, 100% 88%, 94% 100%, 84% 86%, 74% 100%, 62% 84%, 50% 100%, 38% 84%, 26% 100%, 14% 86%, 6% 100%, 0 88%)";

function RoleSwitcher() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  // A worker login has no manager view to preview — this pill is only the admin's own
  // convenience toggle for checking what the other side's screen looks like.
  if (state.role === "child" || !state.onboarded || location.pathname.startsWith("/onboarding") || location.pathname === "/login") return null;

  function go(mode: "parent" | "child") {
    dispatch({ type: "SET_VIEW_MODE", mode });
    navigate(homePath(mode));
  }

  return (
    <div className="role-switcher" style={{ flexShrink: 0 }}>
      <button
        className={state.viewMode === "parent" ? "active" : ""}
        onClick={() => go("parent")}
        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        <IconParentUser size={13} strokeWidth={2.2} /> {V.admin}
      </button>
      <button
        className={state.viewMode === "child" ? "active" : ""}
        onClick={() => go("child")}
        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        <IconChildUser size={13} strokeWidth={2.2} /> {V.worker}
      </button>
    </div>
  );
}

export function Header({
  title,
  titleNote,
  subtitle,
  back,
  right,
  tall,
  tint = "red",
  children,
}: {
  title: string;
  /** Shown beside the title in the accent, for identity rather than description —
   * whose journal this is. Shares the title's single line, so a long one truncates
   * with it rather than pushing the layout around. */
  titleNote?: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  tall?: boolean;
  /** "pro" is the business/work-journal look: a calm slate bar, no melt edge or
   * floating decorations — deliberately sober next to the family app's playful sky. */
  tint?: "red" | "purple" | "transparent" | "playful" | "pro";
  children?: ReactNode;
}) {
  const navigate = useNavigate();
  const playful = tint === "playful";
  const pro = tint === "pro";
  return (
    <header
      className={playful ? "dream-sky" : pro ? "hero" : undefined}
      style={{
        background: playful
          ? "linear-gradient(120deg, var(--header-gradient) 0%, var(--violet-700) 45%, var(--amber-600) 75%, var(--header-gradient) 100%)"
          : pro
            ? undefined /* the .hero class paints it — one definition, in the stylesheet */
            : tint === "transparent"
              ? "none"
              : tint === "purple"
                ? "var(--violet-700)"
                : "var(--header-gradient)",
        color: "#fff",
        padding: tall ? "20px 20px 34px" : playful ? "16px 20px 32px" : pro ? "11px 20px 13px" : "16px 20px 20px",
        borderRadius: 0,
        display: "flex",
        flexDirection: "column",
        gap: pro ? 9 : 12,
        flexShrink: 0,
        position: "relative",
        overflow: playful ? "hidden" : undefined,
        clipPath: playful ? MELT_CLIP : undefined,
        boxShadow: pro ? "0 1px 0 rgba(255,255,255,0.06) inset, 0 2px 10px -4px rgba(16,24,40,0.5)" : undefined,
      }}
    >
      {playful && <SurrealBackdrop />}
      {/* The actions wrap onto their own line rather than squeezing the title: with a
          role switcher and two buttons on a narrow phone there is simply not enough
          width for all of it, and flex correctly gave the title whatever was left —
          which was nothing. A floor on the title's width is what forces the wrap. */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, rowGap: 10, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
        {/* minWidth is a real floor, not 0: a flex item with the default overflow
            (hidden, via textOverflow below) has no automatic minimum size, so with
            minWidth:0 this block would rather shrink itself to nothing than let
            RoleSwitcher wrap to its own line — the title silently disappearing on a
            narrow phone instead of just truncating. */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 110, flex: "1 1 190px" }}>
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
              className={pro ? "display" : undefined}
              style={{
                fontSize: pro ? 21 : 20,
                fontWeight: pro ? 400 : 800,
                letterSpacing: pro ? 0 : "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
              {titleNote && (
                <span
                  className={pro ? "display" : undefined}
                  style={{
                    color: pro ? work.onDark : "rgba(255,255,255,0.75)",
                    fontWeight: pro ? 400 : 700,
                    fontSize: pro ? 18 : 15,
                    marginInlineStart: 8,
                  }}
                >
                  {titleNote}
                </span>
              )}
            </div>
            {subtitle && (
              // A subtitle that wraps to four lines is never what was intended.
              <div
                style={{
                  fontSize: 12.5,
                  // On the gold bar the subtitle has its own colour rather than a
                  // faded white, which on this ground reads as washed out.
                  color: pro ? work.onDark : undefined,
                  opacity: pro ? 1 : 0.8,
                  marginTop: 3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginInlineStart: "auto" }}>
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
