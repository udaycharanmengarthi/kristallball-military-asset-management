const VARIANTS = {
  brass: "bg-brass-500/15 text-brass-300 border-brass-600/40",
  steel: "bg-steel-500/15 text-steel-300 border-steel-600/40",
  moss: "bg-moss-500/15 text-moss-400 border-moss-600/40",
  rust: "bg-rust-500/15 text-rust-400 border-rust-600/40",
  mist: "bg-ink-700 text-mist-300 border-ink-600",
};

export default function Badge({ children, variant = "mist" }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[11px] uppercase tracking-widest2 ${VARIANTS[variant]}`}
    >
      {children}
    </span>
  );
}
