import { useEffect, useRef, useState } from "react";
import { work } from "../data/vocabulary";

/**
 * Speak the task instead of typing it.
 *
 * The manager this is built for is holding a phone in one hand and a drill in the
 * other, and typing Hebrew on a phone is the single slowest thing in the product. The
 * browser already does speech-to-text in Hebrew for free and on the device, so this
 * costs nothing to run and sends no audio anywhere.
 *
 * It is strictly an accelerator: where it is unavailable — Firefox, older iOS Safari —
 * the button simply is not rendered, and the field it feeds is an ordinary text field
 * that was always there.
 */
type SpeechCtor = new () => SpeechRecognitionLike;

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

function speechCtor(): SpeechCtor | null {
  const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function DictateButton({ onText, label = "🎤 הכתבה" }: { onText: (text: string) => void; label?: string }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const supported = !!speechCtor();

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  if (!supported) return null;

  function toggle() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const Ctor = speechCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = "he-IL";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript;
      const trimmed = text.trim();
      if (trimmed) onText(trimmed);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      style={{
        background: listening ? work.alert : "#ffffff",
        color: listening ? "#ffffff" : "var(--ink)",
        border: `1px solid ${listening ? work.alert : "var(--line)"}`,
        borderRadius: 9,
        padding: "9px 12px",
        fontSize: 12.5,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {listening ? "● מקליט… לחץ לסיום" : label}
    </button>
  );
}
