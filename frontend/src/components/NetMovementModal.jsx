import { X, ArrowDownToLine, ArrowRightLeft, ArrowLeftRight } from "lucide-react";
import { formatSigned } from "../utils/format";

export default function NetMovementModal({ metrics, onClose }) {
  if (!metrics) return null;

  const rows = [
    { label: "Purchases", value: metrics.purchases, icon: ArrowDownToLine, accent: "text-moss-400" },
    { label: "Transfers In", value: metrics.transfersIn, icon: ArrowRightLeft, accent: "text-steel-400" },
    { label: "Transfers Out", value: -metrics.transfersOut, icon: ArrowLeftRight, accent: "text-rust-400" },
  ];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg border border-ink-600 bg-ink-800 shadow-panel"
      >
        <div className="flex items-center justify-between border-b border-ink-600 px-5 py-4">
          <div>
            <h3 className="font-mono text-sm font-semibold uppercase tracking-widest2 text-mist-50">
              Net Movement Breakdown
            </h3>
            <p className="mt-0.5 text-xs text-mist-400">Purchases + Transfers In − Transfers Out</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-mist-400 transition hover:bg-ink-700 hover:text-mist-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-5">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-mist-200">
                <row.icon className={`h-4 w-4 ${row.accent}`} strokeWidth={1.75} />
                {row.label}
              </div>
              <span className={`mono-num text-sm font-medium ${row.accent}`}>
                {formatSigned(row.value)}
              </span>
            </div>
          ))}

          <div className="my-2 border-t border-dashed border-ink-600" />

          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-widest2 text-mist-300">
              Net Movement
            </span>
            <span className="mono-num text-lg font-semibold text-brass-400">
              {formatSigned(metrics.netMovement)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
