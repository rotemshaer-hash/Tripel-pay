import { useEffect, useRef, useState } from "react";

/** Animates a number from its last settled value to `value` on every change
 * (including the very first render, where it starts from 0) — the one motion
 * moment on a balance/hero figure, per the redesign's "quiet unless it counts"
 * motion budget. Respects prefers-reduced-motion by jumping straight to the value. */
export function useCountUp(value: number, duration = 700): number {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
}
