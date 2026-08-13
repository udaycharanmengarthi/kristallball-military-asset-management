import { useEffect, useState } from "react";
import { auditApi } from "../services/resources";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import Panel from "../components/Panel";
import { formatDateTime } from "../utils/format";

const ACTION_VARIANT = {
  LOGIN: "steel",
  PURCHASE: "moss",
  TRANSFER: "brass",
  ASSIGNMENT: "steel",
  EXPENDITURE: "rust",
  CREATE_EQUIPMENT: "mist",
  CREATE_BASE: "mist",
  UPDATE_ASSET: "mist",
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    auditApi
      .list(actionFilter ? { action: actionFilter } : {})
      .then((res) => setLogs(res.data.data))
      .catch(() => setError("Unable to load audit logs."))
      .finally(() => setLoading(false));
  }, [actionFilter]);

  const columns = [
    { key: "createdAt", header: "Timestamp", render: (r) => formatDateTime(r.createdAt) },
    {
      key: "action",
      header: "Action",
      render: (r) => <Badge variant={ACTION_VARIANT[r.action] || "mist"}>{r.action}</Badge>,
    },
    { key: "user", header: "User", render: (r) => r.user?.username || "System" },
    { key: "details", header: "Details", render: (r) => <span className="text-mist-300">{r.details}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-mist-50">Audit Logs</h1>
          <p className="mt-0.5 text-sm text-mist-400">
            Immutable record of every asset-changing action in the system
          </p>
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="form-input w-auto"
        >
          <option value="">All actions</option>
          {Object.keys(ACTION_VARIANT).map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <Panel>
        <DataTable
          columns={columns}
          rows={logs}
          loading={loading}
          error={error}
          emptyMessage="No audit entries match this view"
        />
      </Panel>
    </div>
  );
}
