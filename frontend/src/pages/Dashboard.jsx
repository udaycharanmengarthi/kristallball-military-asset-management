import { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, TrendingUp, UserCheck, Flame } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { assetApi, baseApi, equipmentApi } from "../services/resources";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";
import FilterBar from "../components/FilterBar";
import NetMovementModal from "../components/NetMovementModal";
import Panel from "../components/Panel";
import { formatNumber } from "../utils/format";

export default function Dashboard() {
  const { user } = useAuth();
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [filters, setFilters] = useState({});
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNetModal, setShowNetModal] = useState(false);

  useEffect(() => {
    baseApi.list().then((res) => setBases(res.data.data)).catch(() => {});
    equipmentApi.list().then((res) => setEquipmentTypes(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    assetApi
      .metrics(filters)
      .then((res) => setMetrics(res.data.data))
      .catch(() => setError("Unable to load dashboard metrics."))
      .finally(() => setLoading(false));
  }, [filters]);

  const balanceData = useMemo(() => {
    if (!metrics) return [];
    return [
      { name: "Opening", value: metrics.openingBalance, fill: "#5b6570" },
      { name: "Closing", value: metrics.closingBalance, fill: "#d6ae5b" },
    ];
  }, [metrics]);

  const movementData = useMemo(() => {
    if (!metrics) return [];
    return [
      { name: "Purchases", value: metrics.purchases, fill: "#5b8c5a" },
      { name: "Transfers In", value: metrics.transfersIn, fill: "#4c8dae" },
      { name: "Transfers Out", value: -metrics.transfersOut, fill: "#b54b4b" },
      { name: "Assigned", value: -metrics.assigned, fill: "#c89b3c" },
      { name: "Expended", value: -metrics.expended, fill: "#8f3a3a" },
    ];
  }, [metrics]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-mist-50">Operational Dashboard</h1>
          <p className="mt-0.5 text-sm text-mist-400">
            {user?.role === "BASE_COMMANDER"
              ? "Scoped to your assigned base"
              : "Inventory position across the force"}
          </p>
        </div>
      </div>

      <FilterBar
        bases={bases}
        equipmentTypes={equipmentTypes}
        filters={filters}
        onChange={setFilters}
        showBaseFilter={user?.role !== "BASE_COMMANDER"}
      />

      {error && (
        <div className="rounded-md border border-rust-600/40 bg-rust-500/10 px-4 py-3 text-sm text-rust-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Opening Balance"
          value={loading ? null : metrics?.openingBalance}
          accent="mist"
        />
        <StatCard
          label="Net Movement"
          value={loading ? null : metrics?.netMovement}
          signed
          accent="steel"
          onClick={() => metrics && setShowNetModal(true)}
        />
        <StatCard
          label="Assigned"
          value={loading ? null : metrics?.assigned}
          accent="brass"
        />
        <StatCard
          label="Expended"
          value={loading ? null : metrics?.expended}
          accent="rust"
        />
        <StatCard
          label="Closing Balance"
          value={loading ? null : metrics?.closingBalance}
          accent="moss"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Panel
          title="Stock Levels"
          description="Opening vs. closing balance"
          className="lg:col-span-2"
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={balanceData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1b2027" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#8d97a1", fontSize: 11, fontFamily: "IBM Plex Mono" }}
                  axisLine={{ stroke: "#262c34" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#8d97a1", fontSize: 11, fontFamily: "IBM Plex Mono" }}
                  axisLine={{ stroke: "#262c34" }}
                  tickLine={false}
                  tickFormatter={(v) => formatNumber(v)}
                />
                <Tooltip
                  contentStyle={{
                    background: "#13171c",
                    border: "1px solid #262c34",
                    borderRadius: 6,
                    fontSize: 12,
                    fontFamily: "IBM Plex Mono",
                  }}
                  labelStyle={{ color: "#dde1e5" }}
                  formatter={(v) => formatNumber(v)}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={72} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Movement Breakdown"
          description="Components of net movement, plus assigned & expended"
          className="lg:col-span-3"
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={movementData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1b2027" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#8d97a1", fontSize: 11, fontFamily: "IBM Plex Mono" }}
                  axisLine={{ stroke: "#262c34" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#8d97a1", fontSize: 11, fontFamily: "IBM Plex Mono" }}
                  axisLine={{ stroke: "#262c34" }}
                  tickLine={false}
                  tickFormatter={(v) => formatNumber(v)}
                />
                <Tooltip
                  contentStyle={{
                    background: "#13171c",
                    border: "1px solid #262c34",
                    borderRadius: 6,
                    fontSize: 12,
                    fontFamily: "IBM Plex Mono",
                  }}
                  labelStyle={{ color: "#dde1e5" }}
                  formatter={(v) => formatNumber(v)}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat icon={ArrowDownToLine} label="Purchases (period)" value={metrics?.purchases} accent="text-moss-400" />
        <MiniStat icon={TrendingUp} label="Current on-hand" value={metrics?.currentQuantity} accent="text-steel-400" />
        <MiniStat icon={UserCheck} label="Total assigned" value={metrics?.assignedTotal} accent="text-brass-400" />
        <MiniStat icon={Flame} label="Total expended" value={metrics?.expendedTotal} accent="text-rust-400" />
      </div>

      {showNetModal && (
        <NetMovementModal metrics={metrics} onClose={() => setShowNetModal(false)} />
      )}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-ink-600 bg-ink-800/50 p-4">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink-700 ${accent}`}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-mist-400">{label}</div>
        <div className="mono-num text-lg font-semibold text-mist-50">
          {value === undefined ? "—" : formatNumber(value)}
        </div>
      </div>
    </div>
  );
}
