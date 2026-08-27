import { useEffect, useState } from "react";
import { work } from "../data/vocabulary";

/**
 * Put the app on the manager's home screen.
 *
 * The worker deliberately installs nothing — the link is the whole point. The manager
 * is the opposite: they open this several times a day, and an icon on the home screen
 * is the difference between a tool and a browser tab they forget.
 *
 * Chromium fires `beforeinstallprompt` and lets us open the real install dialog. iOS
 * Safari does not, so there the button explains the two taps instead of pretending —
 * a button that does nothing is worse than a sentence that tells the truth.
 */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallButton() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  if (!prompt) {
    if (!isIos()) return null;
    return (
      <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.6 }}>
        להתקנה על האייפון: כפתור השיתוף בסרגל התחתון ← "הוסף למסך הבית".
      </div>
    );
  }

  return (
    <button
      onClick={async () => {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice.outcome === "accepted") setInstalled(true);
        setPrompt(null);
      }}
      style={{ width: "100%", background: work.ink, color: "#ffffff", border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 800 }}
    >
      התקנת האפליקציה במסך הבית
    </button>
  );
}
