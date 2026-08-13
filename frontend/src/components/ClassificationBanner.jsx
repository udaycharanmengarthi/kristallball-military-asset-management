export default function ClassificationBanner() {
  return (
    <div
      className="relative flex h-6 items-center justify-center overflow-hidden whitespace-nowrap bg-brass-500 text-[9px] font-mono font-semibold uppercase tracking-widest2 text-ink-950 sm:text-[11px]"
      role="status"
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 10px, transparent 10px, transparent 20px)",
        }}
      />
      <span className="relative px-2 sm:hidden">Training System — Demo Data Only</span>
      <span className="relative hidden px-2 sm:inline">
        Training System — Demonstration Data Only — Not For Operational Use
      </span>
    </div>
  );
}
