import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import {
  transferApi,
  baseApi,
  equipmentApi,
} from "../services/resources";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import Panel from "../components/Panel";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import {
  formatNumber,
  formatDate,
  todayISO,
} from "../utils/format";

const CAN_CREATE = [
  "ADMIN",
  "LOGISTICS_OFFICER",
  "BASE_COMMANDER",
];

export default function Transfers() {
  const { user } = useAuth();
  const { push } = useToast();

  const [allBases, setAllBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [transfers, setTransfers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingForm, setLoadingForm] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canCreate = CAN_CREATE.includes(user?.role);
  const isCommander = user?.role === "BASE_COMMANDER";

  const [form, setForm] = useState({
    sourceBaseId: "",
    destinationBaseId: "",
    equipmentTypeId: "",
    quantity: "",
    transferDate: todayISO(),
  });

  /*
   * The backend auth response uses user.baseId.
   * Normalize it once so string/number mismatches cannot break filtering.
   */
  const commanderBaseId = useMemo(() => {
    if (!isCommander) return "";

    if (
      user?.baseId === null ||
      user?.baseId === undefined ||
      user?.baseId === ""
    ) {
      return "";
    }

    return String(user.baseId);
  }, [user, isCommander]);

  /*
   * The actual assigned base for the commander.
   */
  const commanderBase = useMemo(() => {
    if (!isCommander || !commanderBaseId) {
      return null;
    }

    return allBases.find(
      (base) =>
        String(base.id) === commanderBaseId
    ) || null;
  }, [
    allBases,
    commanderBaseId,
    isCommander,
  ]);

  /*
   * Source options:
   * Commander -> exactly their assigned base
   * Admin/Logistics -> every base
   */
  const sourceBases = useMemo(() => {
    if (!isCommander) {
      return allBases;
    }

    return commanderBase
      ? [commanderBase]
      : [];
  }, [
    allBases,
    commanderBase,
    isCommander,
  ]);

  /*
   * Destination options:
   * Always every base except the selected source.
   */
  const destinationBases = useMemo(() => {
    if (!allBases.length) {
      return [];
    }

    return allBases.filter(
      (base) =>
        String(base.id) !==
        String(form.sourceBaseId)
    );
  }, [
    allBases,
    form.sourceBaseId,
  ]);

  /*
   * Load bases and equipment exactly once.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadFormData() {
      setLoadingForm(true);

      try {
        const [
          basesResponse,
          equipmentResponse,
        ] = await Promise.all([
          baseApi.list(),
          equipmentApi.list(),
        ]);

        if (cancelled) return;

        const bases =
          basesResponse?.data?.data ?? [];

        const equipment =
          equipmentResponse?.data?.data ?? [];

        setAllBases(
          Array.isArray(bases) ? bases : []
        );

        setEquipmentTypes(
          Array.isArray(equipment)
            ? equipment
            : []
        );
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Failed to load transfer form data:",
          err
        );

        setError(
          "Failed to load bases or equipment."
        );
      } finally {
        if (!cancelled) {
          setLoadingForm(false);
        }
      }
    }

    loadFormData();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Set the commander's source base after
   * both user and bases are available.
   */
  useEffect(() => {
    if (!isCommander) {
      return;
    }

    if (!commanderBaseId) {
      setForm((current) => ({
        ...current,
        sourceBaseId: "",
      }));
      return;
    }

    if (!commanderBase) {
      console.error(
        "Commander baseId does not match any base.",
        {
          user,
          commanderBaseId,
          allBases,
        }
      );

      setForm((current) => ({
        ...current,
        sourceBaseId: "",
      }));

      return;
    }

    setForm((current) => {
      const nextSourceBaseId =
        String(commanderBase.id);

      if (
        String(current.sourceBaseId) ===
        nextSourceBaseId
      ) {
        return current;
      }

      return {
        ...current,
        sourceBaseId: nextSourceBaseId,
      };
    });
  }, [
    isCommander,
    commanderBaseId,
    commanderBase,
    user,
    allBases,
  ]);

  /*
   * Load transfer history.
   */
  async function loadTransfers() {
    setLoading(true);

    try {
      const response =
        await transferApi.list();

      const rows =
        response?.data?.data ?? [];

      setTransfers(
        Array.isArray(rows) ? rows : []
      );
    } catch (err) {
      console.error(
        "Failed to load transfers:",
        err
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransfers();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const sourceBaseId =
      Number(form.sourceBaseId);

    const destinationBaseId =
      Number(form.destinationBaseId);

    const equipmentTypeId =
      Number(form.equipmentTypeId);

    const quantity =
      Number(form.quantity);

    /*
     * Required fields.
     */
    if (
      !form.sourceBaseId ||
      !Number.isFinite(sourceBaseId)
    ) {
      const message =
        "Please select a valid source base.";

      setError(message);
      push(message, "error");
      return;
    }

    if (
      !form.destinationBaseId ||
      !Number.isFinite(destinationBaseId)
    ) {
      const message =
        "Please select a destination base.";

      setError(message);
      push(message, "error");
      return;
    }

    if (
      !form.equipmentTypeId ||
      !Number.isFinite(equipmentTypeId)
    ) {
      const message =
        "Please select an equipment type.";

      setError(message);
      push(message, "error");
      return;
    }

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      const message =
        "Quantity must be greater than zero.";

      setError(message);
      push(message, "error");
      return;
    }

    /*
     * Same-base validation.
     */
    if (
      sourceBaseId ===
      destinationBaseId
    ) {
      const message =
        "Source and destination base must be different.";

      setError(message);
      push(message, "error");
      return;
    }

    /*
     * Client-side RBAC validation.
     * Backend still performs the real authorization.
     */
    if (
      isCommander &&
      sourceBaseId !==
        Number(commanderBaseId)
    ) {
      const message =
        "Base Commanders may only initiate transfers from their own base.";

      setError(message);
      push(message, "error");
      return;
    }

    setSubmitting(true);

    try {
      await transferApi.create({
        sourceBaseId,
        destinationBaseId,
        equipmentTypeId,
        quantity,
        transferDate:
          form.transferDate,
      });

      push(
        "Transfer completed. Source and destination inventories updated atomically."
      );

      setForm((current) => ({
        ...current,
        sourceBaseId: isCommander
          ? commanderBaseId
          : current.sourceBaseId,
        destinationBaseId: "",
        equipmentTypeId: "",
        quantity: "",
      }));

      await loadTransfers();
    } catch (err) {
      console.error(
        "Transfer failed:",
        err
      );

      const message =
        err?.response?.data?.message ||
        "Failed to execute transfer.";

      setError(message);
      push(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  const columns = [
    {
      key: "transferDate",
      header: "Date",
      render: (row) =>
        formatDate(row.transferDate),
    },
    {
      key: "sourceBase",
      header: "From",
      render: (row) =>
        row.sourceBase?.name || "—",
    },
    {
      key: "destinationBase",
      header: "To",
      render: (row) =>
        row.destinationBase?.name || "—",
    },
    {
      key: "equipment",
      header: "Equipment",
      render: (row) =>
        row.equipmentType?.name || "—",
    },
    {
      key: "quantity",
      header: "Quantity",
      align: "right",
      mono: true,
      render: (row) =>
        formatNumber(row.quantity),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge
          variant={
            row.status === "COMPLETED"
              ? "moss"
              : "rust"
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: "createdBy",
      header: "Initiated By",
      render: (row) =>
        row.createdBy?.username || "—",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-mist-50">
          Transfers
        </h1>

        <p className="mt-0.5 text-sm text-mist-400">
          Move equipment between bases —
          executed as a single atomic transaction
        </p>
      </div>

      {canCreate && (
        <Panel
          title="Initiate Transfer"
          description={
            isCommander
              ? "Base Commanders may only transfer out of their assigned base"
              : "Source inventory is validated before any balance changes"
          }
        >
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
          >
            <Field label="Source Base">
              <select
                required
                disabled={
                  isCommander ||
                  loadingForm
                }
                value={
                  form.sourceBaseId
                }
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sourceBaseId:
                      event.target.value,
                    destinationBaseId: "",
                  }))
                }
                className="form-input"
              >
                {isCommander ? (
                  <option
                    value={
                      commanderBase
                        ? String(
                            commanderBase.id
                          )
                        : ""
                    }
                  >
                    {loadingForm
                      ? "Loading..."
                      : commanderBase?.name ||
                        "Assigned base unavailable"}
                  </option>
                ) : (
                  <>
                    <option value="">
                      Select source…
                    </option>

                    {sourceBases.map(
                      (base) => (
                        <option
                          key={base.id}
                          value={String(
                            base.id
                          )}
                        >
                          {base.name}
                        </option>
                      )
                    )}
                  </>
                )}
              </select>
            </Field>

            <Field label="Destination Base">
              <select
                required
                disabled={loadingForm}
                value={
                  form.destinationBaseId
                }
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    destinationBaseId:
                      event.target.value,
                  }))
                }
                className="form-input"
              >
                <option value="">
                  {loadingForm
                    ? "Loading bases..."
                    : "Select destination…"}
                </option>

                {destinationBases.map(
                  (base) => (
                    <option
                      key={base.id}
                      value={String(
                        base.id
                      )}
                    >
                      {base.name}
                    </option>
                  )
                )}
              </select>
            </Field>

            <Field label="Equipment Type">
              <select
                required
                disabled={
                  loadingForm
                }
                value={
                  form.equipmentTypeId
                }
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    equipmentTypeId:
                      event.target.value,
                  }))
                }
                className="form-input"
              >
                <option value="">
                  Select equipment…
                </option>

                {equipmentTypes.map(
                  (equipment) => (
                    <option
                      key={equipment.id}
                      value={String(
                        equipment.id
                      )}
                    >
                      {equipment.name}
                    </option>
                  )
                )}
              </select>
            </Field>

            <Field label="Quantity">
              <input
                type="number"
                min="1"
                required
                value={form.quantity}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    quantity:
                      event.target.value,
                  }))
                }
                className="form-input"
                placeholder="0"
              />
            </Field>

            <Field label="Transfer Date">
              <input
                type="date"
                required
                value={
                  form.transferDate
                }
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    transferDate:
                      event.target.value,
                  }))
                }
                className="form-input"
              />
            </Field>

            <div className="sm:col-span-2 lg:col-span-5">
              <Button
                type="submit"
                disabled={
                  submitting ||
                  loadingForm ||
                  !form.sourceBaseId ||
                  !form.destinationBaseId ||
                  !form.equipmentTypeId ||
                  !form.quantity
                }
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowLeftRight className="h-4 w-4" />
                )}

                Execute Transfer
              </Button>
            </div>
          </form>

          {error && (
            <p className="mt-3 text-sm text-rust-400">
              {error}
            </p>
          )}
        </Panel>
      )}

      <Panel title="Transfer History">
        <DataTable
          columns={columns}
          rows={transfers}
          loading={loading}
          emptyMessage="No transfers recorded yet"
        />
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