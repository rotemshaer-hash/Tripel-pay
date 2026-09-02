type IconProps = { size?: number; color?: string; strokeWidth?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
});

export function IconCalendar({ size = 22, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke={color} strokeWidth={strokeWidth} />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconHome({ size = 22, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M3.5 10.5 12 3.5l8.5 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 9v9.5a1 1 0 0 0 1 1H17.5a1 1 0 0 0 1-1V9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 19.5v-5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMountain({ size = 22, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M2.5 19 9 8l3.2 5.2L14 10l7.5 9H2.5Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
      <path d="M9 8v-4M9 4l2.4 1.2L9 6.4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconKids({ size = 22, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="5.3" r="2.3" stroke={color} strokeWidth={strokeWidth} />
      <path d="M12 9v7.5M4.5 5.5 9.5 10M19.5 5.5 14.5 10M8 21l4-4.5 4 4.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconGift({ size = 22, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="4" y="10" width="16" height="10" rx="1" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M3 7h18v3.2H3zM12 10v10" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
      <path d="M12 7c0-2.2-1.6-4-3.5-4S6 4.3 6 6c0 1 .8 1 2 1h4Zm0 0c0-2.2 1.6-4 3.5-4S18 4.3 18 6c0 1-.8 1-2 1h-4Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </svg>
  );
}

export function IconGraduationCap({ size = 22, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="m2.5 8.5 9.5-4 9.5 4-9.5 4-9.5-4Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M6.5 10.4v4.2c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6v-4.2M20 9v5.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconBroom({ size = 22, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M20 3 9.5 13.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M9.5 13.5c-1 -1-3-1-4.5.5C3.6 15.4 3 18 2.5 20c2-.5 4.6-1.1 6-2.5 1.5-1.5 1.5-3.5.5-4.5Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M6.8 16.2 4.2 18.8M9 14l2 2" stroke={color} strokeWidth={strokeWidth * 0.85} strokeLinecap="round" />
    </svg>
  );
}

export function IconDishes({ size = 22, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)}>
      <ellipse cx="12" cy="17.5" rx="8.5" ry="2.3" stroke={color} strokeWidth={strokeWidth} />
      <ellipse cx="12" cy="13.5" rx="7" ry="2" stroke={color} strokeWidth={strokeWidth} />
      <path d="M17.5 6.5c1 .6 1.7 1.6 1.7 2.7 0 1.9-2.1 3.4-4.7 3.4S9.8 11.1 9.8 9.2c0-1.1.7-2.1 1.7-2.7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M14.5 3.5v4M17 9l2 1.6M12.3 9l-2-1.4" stroke={color} strokeWidth={strokeWidth * 0.8} strokeLinecap="round" />
    </svg>
  );
}

export function IconPiggyBank({ size = 22, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path
        d="M6.5 10.2c0-3 2.7-5.4 6-5.4 2.4 0 4.5 1.3 5.4 3.2h1.6c.5 0 .8.6.5 1l-1.2 1.6c.15.5.2 1 .2 1.5 0 2.3-1.5 4.3-3.6 5.2v2c0 .5-.4 1-1 1h-1.5c-.5 0-1-.4-1-1v-.8a8 8 0 0 1-1.4.1c-.7 0-1.4-.1-2-.3v1c0 .5-.4 1-1 1H5.4c-.5 0-1-.4-1-1v-2.3C3 16.2 2 14.6 2 12.8c0-1 .3-1.9.9-2.6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="15.5" cy="10" r=".9" fill={color} />
      <path d="M8.5 5.5 7 3.2M14 4.7l.9-2.2" stroke={color} strokeWidth={strokeWidth * 0.85} strokeLinecap="round" />
    </svg>
  );
}

export function IconPlaneTicket({ size = 22, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path
        d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v2.3a1.6 1.6 0 0 0 0 2.9v2.6a1.6 1.6 0 0 0 0 2.9v.3A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-.3a1.6 1.6 0 0 0 0-2.9v-2.6a1.6 1.6 0 0 0 0-2.9Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path d="M8 5v14" stroke={color} strokeWidth={strokeWidth * 0.8} strokeDasharray="1.6 1.6" />
      <path d="M13 9.5h5l-2.2 3-2.8.6Zm0 0-1.5 1.2 1 .6" stroke={color} strokeWidth={strokeWidth * 0.9} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function IconTicket({ size = 22, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path
        d="M3 8.5A1.5 1.5 0 0 1 4.5 7h15A1.5 1.5 0 0 1 21 8.5v1a1.5 1.5 0 0 0 0 3v1A1.5 1.5 0 0 1 19.5 15h-15A1.5 1.5 0 0 1 3 13.5v-1a1.5 1.5 0 0 0 0-3Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <text x="12" y="12.5" fontSize="4.6" fontWeight="700" fill={color} textAnchor="middle" fontFamily="sans-serif">
        TICKET
      </text>
    </svg>
  );
}

export function IconFood({ size = 22, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M7 3v6.5a2 2 0 0 1-2 2H4M5.5 3v8.5M8.5 3v8.5M7 11.5V21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 3c-1.7 0-3 2-3 5s1.3 5 3 5v8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconScooter({ size = 22, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="5.5" cy="18" r="2" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="17.5" cy="18" r="2" stroke={color} strokeWidth={strokeWidth} />
      <path d="M5.5 16 9 8.5h6.5M9 8.5H7M15.5 16h2l-1.5-4.5h-3.3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 8.5 6.7 4M16 4h2.2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M12.3 11.5 14 8.6" stroke={color} strokeWidth={strokeWidth * 0.85} strokeLinecap="round" />
    </svg>
  );
}

export function IconToy({ size = 22, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="9" cy="7" r="3.2" stroke={color} strokeWidth={strokeWidth} />
      <path d="M9 10.2c-3 0-5.5 2-5.5 5.3V19a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3.5c0-3.3-2.5-5.3-5.5-5.3Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <circle cx="7.3" cy="6.4" r=".7" fill={color} />
      <circle cx="10.7" cy="6.4" r=".7" fill={color} />
      <path d="M17.5 13.5v6M14.5 16.5h6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconPeopleCoin({ size = 22, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="8" cy="7.5" r="2.3" stroke={color} strokeWidth={strokeWidth} />
      <path d="M3.2 17c.5-3 2.3-4.5 4.8-4.5s4.3 1.5 4.8 4.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16.5" cy="15.5" r="4" stroke={color} strokeWidth={strokeWidth} />
      <path d="M16.5 13.3v4.4M15.2 16.3c.2.5.7.8 1.3.8.8 0 1.3-.4 1.3-1s-.5-.9-1.3-1.1c-.8-.2-1.3-.5-1.3-1.1 0-.6.5-1 1.3-1 .6 0 1.1.3 1.3.8" stroke={color} strokeWidth={strokeWidth * 0.85} strokeLinecap="round" />
    </svg>
  );
}

export function IconCardCheck({ size = 22, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="2.5" y="5.5" width="16" height="12" rx="1.6" stroke={color} strokeWidth={strokeWidth} />
      <path d="M2.5 9.3h16M5.5 14h4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M16 15.5 18 17.5 22 12.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconReceipt({ size = 22, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M5 3.5h14v17l-2.3-1.5-2.3 1.5-2.4-1.5-2.4 1.5-2.3-1.5L5 20.5Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M7.8 8h8.4M7.8 11.5h8.4M7.8 15h5.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconTrophy({ size = 22, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M7.5 4h9v5.2c0 2.7-2 5-4.5 5s-4.5-2.3-4.5-5Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M7.5 5.5H5a1 1 0 0 0-1 1v1.2c0 1.8 1.3 3.3 3 3.6M16.5 5.5H19a1 1 0 0 1 1 1v1.2c0 1.8-1.3 3.3-3 3.6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M12 14.2v2.6M9 20.5h6M9.5 20.5c0-1.7.9-2.7 2.5-2.7s2.5 1 2.5 2.7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChecklist({ size = 22, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth={strokeWidth} />
      <path d="M9 2.5h6v2.2a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="m7.8 10.8 1.4 1.4 2.5-2.7M7.8 16.3l1.4 1.4 2.5-2.7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.3 11h2.7M14.3 16.5h2.7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function IconParentUser({ size = 22, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="7" r="3" stroke={color} strokeWidth={strokeWidth} />
      <path d="M5.3 20c.6-4.7 3-6.9 6.7-6.9s6.1 2.2 6.7 6.9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChildUser({ size = 22, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="10.8" cy="8.7" r="2.5" stroke={color} strokeWidth={strokeWidth} />
      <path d="M5.8 20c.5-3.7 2.3-5.4 5-5.4s4.5 1.7 5 5.4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.4 3.8v3.2M15.8 5.4h3.2" stroke={color} strokeWidth={strokeWidth * 0.9} strokeLinecap="round" />
    </svg>
  );
}
