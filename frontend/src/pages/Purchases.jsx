import { useEffect, useState } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { purchaseApi, baseApi, equipmentApi } from "../services/resources";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import Panel from "../components/Panel";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import { formatNumber, formatDate, todayISO } from "../utils/format";

const CAN_CREATE = ["ADMIN", "LOGISTICS_OFFICER", "BASE_COMMANDER"];

export default function Purchases() {
  const { user } = useAuth();
  const { push } = useToast();
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canCreate = CAN_CREATE.includes(user?.role);
  const isCommander = user?.role === "BASE_COMMANDER";

  const [form, setForm] = useState({
    baseId: "",
    equipmentTypeId: "",
    quantity: "",
    purchaseDate: todayISO(),
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

  function loadPurchases() {
    setLoading(true);
    purchaseApi
      .list()
      .then((res) => setPurchases(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(loadPurchases, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await purchaseApi.create({
        ...form,
        baseId: Number(form.baseId),
        equipmentTypeId: Number(form.equipmentTypeId),
        quantity: Number(form.quantity),
      });
      push("Purchase recorded and inventory updated.");
      setForm((f) => ({ ...f, quantity: "" }));
      loadPurchases();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to record purchase.";
      setError(msg);
      push(msg, "error");
    } finally {
      setSubmitting(false);
    }
  }

  const columns = [
    { key: "purchaseDate", header: "Date", render: (r) => formatDate(r.purchaseDate) },
    { key: "base", header: "Base", render: (r) => r.base?.name || "—" },
    { key: "equipment", header: "Equipment", render: (r) => r.equipmentType?.name || "—" },
    { key: "quantity", header: "Quantity", align: "right", mono: true, render: (r) => `+${formatNumber(r.quantity)}` },
    { key: "createdBy", header: "Created By", render: (r) => r.createdBy?.username || "—" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-mist-50">Purchases</h1>
        <p className="mt-0.5 text-sm text-mist-400">Record incoming equipment and track acquisition history</p>
      </div>

      {canCreate && (
        <Panel title="Record New Purchase" description="Increases on-hand inventory immediately upon submission">
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
            <Field label="Date">
              <input
                type="date"
                required
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                className="form-input"
              />
            </Field>
            <div className="flex items-end">
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                Record Purchase
              </Button>
            </div>
          </form>
          {error && <p className="mt-3 text-sm text-rust-400">{error}</p>}
        </Panel>
      )}

      <Panel title="Purchase History">
        <DataTable columns={columns} rows={purchases} loading={loading} emptyMessage="No purchases recorded yet" />
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
