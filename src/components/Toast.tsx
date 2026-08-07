import { useCallback, useRef, useState } from "react";

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(null), 2200);
  }, []);

  return { toastMessage: message, showToast };
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      style={{
        position: "absolute",
        bottom: 92,
        insetInlineStart: "50%",
        transform: "translateX(50%)",
        background: "var(--ink)",
        color: "#ffffff",
        padding: "11px 20px",
        borderRadius: 999,
        fontSize: 13.5,
        fontWeight: 700,
        boxShadow: "0 10px 24px -8px rgba(0,0,0,0.45)",
        zIndex: 80,
        whiteSpace: "nowrap",
        animation: "screenEnter 0.2s cubic-bezier(.22,1,.36,1) both",
      }}
    >
      {message}
    </div>
  );
}
