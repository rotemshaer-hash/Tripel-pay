import { useRef, useState } from "react";
import type { Child } from "../data/types";
import { EggAvatar } from "./EggAvatar";
import { resizeImageToDataUrl } from "../utils/resizeImage";
import { useStore } from "../data/store";

export function ChildCarousel({ children, activeId, onSelect }: { children: Child[]; activeId: string; onSelect: (id: string) => void }) {
  const { dispatch } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const idx = children.findIndex((c) => c.id === activeId);
  const active = children[idx] ?? children[0];

  function step(dir: 1 | -1) {
    const next = (idx + dir + children.length) % children.length;
    onSelect(children[next].id);
  }

  async function onPhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      dispatch({ type: "SET_CHILD_PHOTO", childId: active.id, photoUrl: dataUrl });
    } catch {
      /* silently ignore a bad/corrupt image pick — the avatar just stays as-is */
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="glass"
      style={{
        position: "relative",
        overflow: "hidden",
        margin: "18px 20px 0",
        borderRadius: "var(--radius-lg)",
        padding: "18px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        // Pin the switcher to the neutral brand tint so it reads as intentional
        // rather than picking up an arbitrary color from its position on the page.
        background: "var(--tint-1)",
      }}
    >
      <span
        aria-hidden="true"
        style={{ position: "absolute", top: -46, insetInlineStart: "50%", transform: "translateX(-50%)", width: 160, height: 160, borderRadius: "50%", background: active.avatarColor, filter: "blur(46px)", opacity: 0.4, pointerEvents: "none" }}
      />
      <button onClick={() => step(-1)} disabled={children.length < 2} style={{ position: "relative", zIndex: 1, fontSize: 22, color: "var(--teal-900)", background: "none", border: "none", opacity: children.length < 2 ? 0.3 : 1 }}>
        ‹
      </button>
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ position: "relative" }}>
          <EggAvatar photoUrl={active.photoUrl} color={active.avatarColor} initial={active.initial} size={72} />
          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label={`העלאת תמונה ל${active.name}`}
            disabled={uploading}
            style={{
              position: "absolute",
              bottom: -2,
              insetInlineEnd: -4,
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "var(--violet-700)",
              border: "2px solid #ffffff",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-card)",
              opacity: uploading ? 0.6 : 1,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="12" cy="14" r="3.2" stroke="#fff" strokeWidth="2" />
            </svg>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onPhotoSelected} style={{ display: "none" }} />
        </div>
        <span style={{ fontSize: 16, fontWeight: 800 }}>{active.name}</span>
      </div>
      <button onClick={() => step(1)} disabled={children.length < 2} style={{ position: "relative", zIndex: 1, fontSize: 22, color: "var(--teal-900)", background: "none", border: "none", opacity: children.length < 2 ? 0.3 : 1 }}>
        ›
      </button>
    </div>
  );
}
