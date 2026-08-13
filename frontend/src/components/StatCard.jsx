import { formatNumber, formatSigned } from "../utils/format";

const ACCENTS = {
  brass: "border-l-brass-500",
  steel: "border-l-steel-500",
  moss: "border-l-moss-500",
  rust: "border-l-rust-500",
  mist: "border-l-mist-400",
};

export default function StatCard({ label, value, signed = false, accent = "mist", onClick, hint }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`group flex w-full flex-col justify-between rounded-lg border border-ink-600 border-l-4 ${ACCENTS[accent]} bg-ink-800/70 p-4 text-left shadow-panel transition ${
        onClick ? "cursor-pointer hover:border-ink-500 hover:bg-ink-800" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-widest2 text-mist-400">
          {label}
        </span>
        {onClick && (
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-mist-500 opacity-0 transition group-hover:opacity-100">
            Details →
          </span>
        )}
      </div>
      <div className="mono-num mt-3 text-3xl font-semibold text-mist-50">
        {signed ? formatSigned(value) : formatNumber(value)}
      </div>
      {hint && <div className="mt-1 text-xs text-mist-400">{hint}</div>}
    </Comp>
  );
}
