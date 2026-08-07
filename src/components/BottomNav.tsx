import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { IconHome, IconMountain, IconKids, IconGift, IconReceipt, IconGraduationCap, IconTrophy, IconPiggyBank } from "./Icons";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  activeMatch: (path: string) => boolean;
}

function NavBar({ items }: { items: NavItem[] }) {
  const location = useLocation();
  return (
    <nav
      style={{
        position: "absolute",
        insetInlineStart: 0,
        insetInlineEnd: 0,
        bottom: 0,
        borderRadius: 0,
        display: "flex",
        padding: "10px 4px 14px",
        background: "#ffffff",
        borderTop: "1px solid var(--line)",
        zIndex: 40,
      }}
    >
      {items.map((item) => {
        const isActive = item.activeMatch(location.pathname);
        return (
          <Link
            key={item.to}
            to={item.to}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "2px 2px",
              color: isActive ? "var(--teal-700)" : "var(--ink-faint)",
              fontSize: 10.5,
              fontWeight: isActive ? 800 : 500,
              transition: "color 0.15s ease",
            }}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ParentBottomNav() {
  return (
    <NavBar
      items={[
        { to: "/parent", label: "בית", icon: <IconHome size={21} />, activeMatch: (p) => p === "/parent" },
        { to: "/parent/child-tasks", label: "מטלות", icon: <IconMountain size={21} />, activeMatch: (p) => p === "/parent/child-tasks" || p === "/parent/tasks-bank" },
        {
          to: "/parent/child-hub",
          label: "הילדים שלי",
          icon: <IconKids size={21} />,
          activeMatch: (p) => ["/parent/child-hub", "/parent/settings", "/parent/savings", "/parent/transactions", "/parent/achievements"].includes(p),
        },
        { to: "/parent/gift-bank", label: "מתנות", icon: <IconGift size={21} />, activeMatch: (p) => p === "/parent/gift-bank" },
      ]}
    />
  );
}

export function ChildBottomNav() {
  return (
    <NavBar
      items={[
        { to: "/child/transactions", label: "תנועות", icon: <IconReceipt size={21} />, activeMatch: (p) => p === "/child/transactions" },
        { to: "/child/courses", label: "הידע שלי", icon: <IconGraduationCap size={21} />, activeMatch: (p) => p === "/child/courses" },
        { to: "/child", label: "בית", icon: <IconHome size={21} />, activeMatch: (p) => p === "/child" },
        { to: "/child/achievements", label: "הישגים", icon: <IconTrophy size={21} />, activeMatch: (p) => p === "/child/achievements" },
        { to: "/child/savings", label: "חיסכון", icon: <IconPiggyBank size={21} />, activeMatch: (p) => p === "/child/savings" },
      ]}
    />
  );
}
