import { professionGroups, professions } from "../data/professions";

/**
 * Which trade this business is in.
 *
 * A native select rather than a grid of fifty cards: this is a one-time answer on the
 * way to somewhere else, and a picker the phone already knows how to scroll beats
 * anything built by hand for it.
 */
export function ProfessionPicker({
  value,
  onChange,
  style,
}: {
  value: string;
  onChange: (id: string) => void;
  style?: React.CSSProperties;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "13px 14px",
        borderRadius: 10,
        border: "1px solid var(--line)",
        fontSize: 14.5,
        background: "#ffffff",
        color: value ? "var(--ink)" : "var(--ink-faint)",
        ...style,
      }}
    >
      <option value="">בחירת תחום…</option>
      {professionGroups.map((group) => (
        <optgroup key={group} label={group}>
          {professions
            .filter((p) => p.group === group)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {`${p.emoji} ${p.name}`}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  );
}
