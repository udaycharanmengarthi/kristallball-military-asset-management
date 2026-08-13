import { SlidersHorizontal } from "lucide-react";

export default function FilterBar({ bases, equipmentTypes, filters, onChange, showBaseFilter = true }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-ink-600 bg-ink-800/50 p-3">
      <div className="flex items-center gap-1.5 pr-1 text-mist-400">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span className="font-mono text-[11px] uppercase tracking-widest2">Filters</span>
      </div>

      {showBaseFilter && (
        <select
          value={filters.baseId || ""}
          onChange={(e) => onChange({ ...filters, baseId: e.target.value || undefined })}
          className="rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm text-mist-100 focus:border-brass-500"
        >
          <option value="">All Bases</option>
          {bases.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      )}

      <select
        value={filters.equipmentTypeId || ""}
        onChange={(e) => onChange({ ...filters, equipmentTypeId: e.target.value || undefined })}
        className="rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm text-mist-100 focus:border-brass-500"
      >
        <option value="">All Equipment</option>
        {equipmentTypes.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={filters.startDate || ""}
        onChange={(e) => onChange({ ...filters, startDate: e.target.value || undefined })}
        className="rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm text-mist-100 focus:border-brass-500"
      />
      <span className="text-mist-500 text-sm">to</span>
      <input
        type="date"
        value={filters.endDate || ""}
        onChange={(e) => onChange({ ...filters, endDate: e.target.value || undefined })}
        className="rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm text-mist-100 focus:border-brass-500"
      />

      {(filters.baseId || filters.equipmentTypeId || filters.startDate || filters.endDate) && (
        <button
          onClick={() => onChange({})}
          className="ml-auto rounded-md border border-ink-600 px-3 py-1.5 text-xs text-mist-400 transition hover:border-rust-500/40 hover:text-rust-400"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
