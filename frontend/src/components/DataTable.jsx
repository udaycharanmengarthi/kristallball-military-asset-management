import { Loader2, Inbox, AlertTriangle } from "lucide-react";

/**
 * columns: [{ key, header, render?(row), align?: 'left'|'right', mono?: boolean }]
 */
export default function DataTable({ columns, rows, loading, error, emptyMessage = "No records found" }) {
  return (
    <div className="overflow-hidden rounded-lg border border-ink-600 bg-ink-800/50 shadow-panel">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-600 bg-ink-850/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`whitespace-nowrap px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-widest2 text-mist-400 ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-mist-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-xs font-mono uppercase tracking-widest2">
                      Loading records
                    </span>
                  </div>
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-rust-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="text-xs">{error}</span>
                  </div>
                </td>
              </tr>
            )}

            {!loading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-mist-500">
                    <Inbox className="h-5 w-5" />
                    <span className="text-xs">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              rows.map((row, idx) => (
                <tr
                  key={row.id ?? idx}
                  className="border-b border-ink-700/60 transition last:border-0 hover:bg-ink-700/30"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`whitespace-nowrap px-4 py-3 text-mist-100 ${
                        col.align === "right" ? "text-right" : "text-left"
                      } ${col.mono ? "mono-num" : ""}`}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
