const VARIANTS = {
  primary: "bg-brass-500 text-ink-950 hover:bg-brass-400 border-transparent",
  secondary: "bg-ink-800 text-mist-100 hover:bg-ink-700 border-ink-600",
  danger: "bg-rust-600 text-mist-50 hover:bg-rust-500 border-transparent",
};

export default function Button({ variant = "primary", className = "", disabled, children, ...props }) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
