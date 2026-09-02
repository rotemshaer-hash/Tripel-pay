import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useStore, useWorkView } from "../data/store";
import { childrenList } from "../data/family";
import { work } from "../data/vocabulary";
import { IconMountain, IconParentUser, IconPeopleCoin, IconReceipt, IconCardCheck } from "./Icons";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  match: (path: string) => boolean;
  /** Count shown on the tab. Work waiting on this person is the one thing that must
   * be visible without opening a screen to look for it. */
  badge?: number;
}

/**
 * Navigation for the business build. Deliberately narrow: the family app's wallet,
 * savings, rewards and lessons are not reachable here — a work journal is about
 * assigning, evidencing and auditing work, and nothing else.
 *
 * Writing a task is not a tab. It is an action, it already has a button on the task
 * list, and giving it a tab of its own pushed this bar to six — at which point every
 * label is too small to read and nothing is easy to hit.
 */
export function WorkBottomNav() {
  const { state } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { isManager } = useWorkView();

  // The manager is the bottleneck: work sits in "submitted" until they look at it.
  // A worker's own count is what they still owe, overdue first in their list.
  const mine = childrenList(state.family).filter((c) => (isManager && !c.archivedAt) || c.id === state.activeChildId);
  const awaiting = mine.reduce((n, c) => n + c.tasks.filter((t) => !t.archivedAt && t.status === "pending_approval").length, 0);
  const open = mine.reduce((n, c) => n + c.tasks.filter((t) => !t.archivedAt && (t.status === "available" || t.status === "in_progress")).length, 0);

  const items: NavItem[] = isManager
    ? [
        { to: "/work/board", label: "משימות", icon: <IconMountain size={21} />, match: (p) => p === "/work/board", badge: awaiting },
        { to: "/work/journal", label: "יומן", icon: <IconReceipt size={21} />, match: (p) => p === "/work/journal" },
        { to: "/work/directory", label: "ספקים", icon: <IconCardCheck size={21} />, match: (p) => p === "/work/directory" },
        { to: "/work/team", label: "צוות", icon: <IconPeopleCoin size={21} />, match: (p) => p === "/work/team" },
        { to: "/work/settings", label: "הגדרות", icon: <IconParentUser size={21} />, match: (p) => p === "/work/settings" },
      ]
    : [
        // No journal tab: /work/journal is the company-wide trail across every
        // worker, gated to managers by RequireParent in App.tsx — a worker landing
        // on it got bounced straight back here with nothing shown, silently, which
        // reads as a dead button. Their own history is the "הושלמו" filter right on
        // this list, so nothing is actually missing by dropping the tab.
        { to: "/work/tasks", label: "המשימות שלי", icon: <IconMountain size={21} />, match: (p) => p === "/work/tasks", badge: open },
        { to: "/work/directory", label: "ספקים", icon: <IconCardCheck size={21} />, match: (p) => p === "/work/directory" },
        { to: "/work/settings", label: "הגדרות", icon: <IconParentUser size={21} />, match: (p) => p === "/work/settings" },
      ];

  // .phone-shell only loses its height cap below the CSS's own 560px breakpoint
  // (index.css: max-height:900px + overflow:hidden from 560px up) — that's the
  // exact case where .screen never overflows its own box, so nothing ever scrolls
  // inside it and a nav pinned to that box (sticky, or fixed with a containing
  // block set by that overflow:hidden) rides off-screen with the rest of the page.
  // Below 560px the fix is a body-level portal, unaffected by any of that. At or
  // above it, the shell already behaves the way sticky always assumed, and a portal
  // would instead glue the nav to the real browser window's bottom edge — visibly
  // detached below the centered, height-capped mockup whenever the window is taller
  // than the frame plus its padding, which is most desktop windows.
  const [isMobile, setIsMobile] = useState(() => typeof window === "undefined" || window.innerWidth < 560);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 559.98px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const nav = (
    <nav
      className="glass-bar"
      style={{
        position: isMobile ? "fixed" : "sticky",
        // Plain left/translateX, not the inline-start logical property: centering
        // is direction-agnostic, and translateX always moves along the physical
        // x-axis regardless of dir, so mixing it with a logical inset would
        // double up in RTL instead of cancelling out. Only needed once this is
        // portaled out to <body> and centering is on us instead of normal layout.
        ...(isMobile ? { left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "var(--shell-w)" } : {}),
        bottom: 0,
        marginTop: isMobile ? undefined : "auto",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "stretch",
        padding: "8px 4px calc(8px + env(safe-area-inset-bottom))",
        flexShrink: 0,
        zIndex: 20,
      }}
    >
      {items.map((item) => {
        const active = item.match(location.pathname);
        return (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "4px 2px",
              // On the teal band the resting state is the header's own secondary
              // colour, not a grey that was chosen against white.
              color: active ? "#ffffff" : work.onDark,
            }}
          >
            <span style={{ position: "relative", display: "inline-flex" }}>
              {item.icon}
              {!!item.badge && item.badge > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    insetInlineEnd: -7,
                    minWidth: 15,
                    height: 15,
                    borderRadius: 999,
                    background: work.alert,
                    color: "#ffffff",
                    fontSize: 9.5,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 3px",
                  }}
                >
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </span>
            <span style={{ fontSize: 10.5, fontWeight: active ? 800 : 600, opacity: active ? 1 : 0.85 }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  // position:fixed alone was still reported as scrolling away on a real phone
  // despite testing fixed on a desktop browser — position:fixed's containing
  // block is only the viewport when no ancestor sets a transform/filter/
  // perspective/contain, and something in that chain (a browser-specific quirk in
  // standalone PWA mode, most likely) turned that into the wrong box without a
  // matching rule to find by reading the CSS. Portaling straight to document.body
  // removes every ancestor between this nav and the real page, so there is no box
  // left that could ever hijack the containing block — but only below the 560px
  // breakpoint, where that fix is actually needed (see above).
  return isMobile ? createPortal(nav, document.body) : nav;
}
