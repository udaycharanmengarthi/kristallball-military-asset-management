import { useEffect, useState } from "react";
import { UserCheck, Loader2 } from "lucide-react";
import { assignmentApi, baseApi, equipmentApi } from "../services/resources";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import Panel from "../components/Panel";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import { formatNumber, formatDate, todayISO } from "../utils/format";

const CAN_CREATE = ["ADMIN", "BASE_COMMANDER"];

export default function Assignments() {
  const { user } = useAuth();
  const { push } = useToast();
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canCreate = CAN_CREATE.includes(user?.role);
  const isCommander = user?.role === "BASE_COMMANDER";

  const [form, setForm] = useState({
    baseId: "",
    equipmentTypeId: "",
    quantity: "",
    assignee: "",
    assignmentDate: todayISO(),
  });

  useEffect(() => {
    baseApi.list().then((res) => {
      const allBases = res.data.data;
      setBases(isCommander ? allBases.filter((b) => b.id === user.baseId) : allBases);
      if (isCommander && user?.baseId) {
        setForm((f) => ({ ...f, baseId: String(user.baseId) }));
      }
    });
    equipmentApi.list().then((res) => setEquipmentTypes(res.data.data));
  }, [isCommander, user]);

  function loadAssignments() {
    setLoading(true);
    assignmentApi
      .list()
      .then((res) => setAssignments(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(loadAssignments, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await assignmentApi.create({
        ...form,
        baseId: Number(form.baseId),
        equipmentTypeId: Number(form.equipmentTypeId),
        quantity: Number(form.quantity),
      });
      push("Assignment recorded.");
      setForm((f) => ({ ...f, quantity: "", assignee: "" }));
      loadAssignments();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to record assignment.";
      setError(msg);
      push(msg, "error");
    } finally {
      setSubmitting(false);
    }
  }

  const columns = [
    { key: "assignmentDate", header: "Date", render: (r) => formatDate(r.assignmentDate) },
    { key: "base", header: "Base", render: (r) => r.base?.name || "—" },
    { key: "equipment", header: "Equipment", render: (r) => r.equipmentType?.name || "—" },
    { key: "quantity", header: "Quantity", align: "right", mono: true, render: (r) => formatNumber(r.quantity) },
    { key: "assignee", header: "Assignee", render: (r) => r.assignee },
    { key: "createdBy", header: "Created By", render: (r) => r.createdBy?.username || "—" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-mist-50">Assignments</h1>
        <p className="mt-0.5 text-sm text-mist-400">Assign equipment to personnel</p>
      </div>

      {canCreate ? (
        <Panel title="New Assignment" description="Reduces on-hand inventory; availability is validated first">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Base">
              <select
                required
                disabled={isCommander}
                value={form.baseId}
                onChange={(e) => setForm({ ...form, baseId: e.target.value })}
                className="form-input"
              >
                <option value="">Select base…</option>
                {bases.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Equipment Type">
              <select
                required
                value={form.equipmentTypeId}
                onChange={(e) => setForm({ ...form, equipmentTypeId: e.target.value })}
                className="form-input"
              >
                <option value="">Select equipment…</option>
                {equipmentTypes.map((eq) => (
                  <option key={eq.id} value={eq.id}>{eq.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Quantity">
              <input
                type="number"
                min="1"
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="form-input"
                placeholder="0"
              />
            </Field>
            <Field label="Assignee">
              <input
                required
                value={form.assignee}
                onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                className="form-input"
                placeholder="Personnel name / ID"
              />
            </Field>
            <Field label="Date">
              <input
                type="date"
                required
                value={form.assignmentDate}
                onChange={(e) => setForm({ ...form, assignmentDate: e.target.value })}
                className="form-input"
              />
            </Field>
            <div className="sm:col-span-2 lg:col-span-5">
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                Record Assignment
              </Button>
            </div>
          </form>
          {error && <p className="mt-3 text-sm text-rust-400">{error}</p>}
        </Panel>
      ) : (
        <div className="rounded-md border border-ink-600 bg-ink-800/50 px-4 py-3 text-sm text-mist-400">
          Your role has view-only access to assignments.
        </div>
      )}

      <Panel title="Assignment History">
        <DataTable columns={columns} rows={assignments} loading={loading} emptyMessage="No assignments recorded yet" />
      </Panel>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-widest2 text-mist-400">
        {label}
      </span>
      {children}
    </label>
  );
}
