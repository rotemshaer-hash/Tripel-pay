import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../data/store";
import { IconChecklist, IconMountain, IconParentUser, IconPeopleCoin, IconReceipt } from "./Icons";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  match: (path: string) => boolean;
}

/**
 * Navigation for the business build. Deliberately narrow: the family app's wallet,
 * savings, rewards and lessons are not reachable here — a work journal is about
 * assigning, evidencing and auditing work, and nothing else.
 */
export function WorkBottomNav() {
  const { state } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isManager = state.role === "parent";

  const items: NavItem[] = isManager
    ? [
        { to: "/work/journal", label: "יומן", icon: <IconReceipt size={21} />, match: (p) => p === "/work/journal" },
        { to: "/work/tasks", label: "משימות", icon: <IconMountain size={21} />, match: (p) => p === "/work/tasks" },
        { to: "/work/new", label: "משימה חדשה", icon: <IconChecklist size={21} />, match: (p) => p === "/work/new" },
        { to: "/work/team", label: "צוות", icon: <IconPeopleCoin size={21} />, match: (p) => p === "/work/team" },
        { to: "/work/settings", label: "הגדרות", icon: <IconParentUser size={21} />, match: (p) => p === "/work/settings" },
      ]
    : [
        { to: "/work/tasks", label: "המשימות שלי", icon: <IconMountain size={21} />, match: (p) => p === "/work/tasks" },
        { to: "/work/journal", label: "יומן", icon: <IconReceipt size={21} />, match: (p) => p === "/work/journal" },
      ];

  return (
    <nav
      style={{
        marginTop: "auto",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "stretch",
        background: "#ffffff",
        borderTop: "1px solid var(--line)",
        padding: "8px 4px calc(8px + env(safe-area-inset-bottom))",
        flexShrink: 0,
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
              color: active ? "#232a3b" : "#9a9ca6",
            }}
          >
            {item.icon}
            <span style={{ fontSize: 10.5, fontWeight: active ? 800 : 600 }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
