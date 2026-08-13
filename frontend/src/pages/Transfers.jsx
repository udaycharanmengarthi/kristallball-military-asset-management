import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeftRight,
  Loader2,
} from "lucide-react";

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

  const [baseError, setBaseError] = useState("");
  const [equipmentError, setEquipmentError] = useState("");
  const [error, setError] = useState("");

  const canCreate =
    CAN_CREATE.includes(user?.role);

  const isCommander =
    user?.role === "BASE_COMMANDER";

  const [form, setForm] = useState({
    sourceBaseId: "",
    destinationBaseId: "",
    equipmentTypeId: "",
    quantity: "",
    transferDate: todayISO(),
  });

  /*
   * Normalize the authenticated user's baseId.
   */
  const commanderBaseId = useMemo(() => {
    if (!isCommander) {
      return "";
    }

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
   * Find the actual base from the full base list.
   */
  const commanderBase = useMemo(() => {
    if (
      !isCommander ||
      !commanderBaseId
    ) {
      return null;
    }

    return (
      allBases.find(
        (base) =>
          String(base.id) ===
          commanderBaseId
      ) || null
    );
  }, [
    allBases,
    commanderBaseId,
    isCommander,
  ]);

  /*
   * Source bases:
   * Commander -> only assigned base.
   * Admin/Logistics -> all bases.
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
   * Destination bases:
   * every base except selected source.
   */
  const destinationBases = useMemo(() => {
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
   * LOAD BASES
   *
   * IMPORTANT:
   * This request is independent from equipment.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadBases() {
      try {
        setBaseError("");

        const response =
          await baseApi.list();

        if (cancelled) {
          return;
        }

        console.log(
          "========== BASE API =========="
        );

        console.log(
          "STATUS:",
          response?.status
        );

        console.log(
          "RAW:",
          response?.data
        );

        console.log(
          "BASE DATA:",
          response?.data?.data
        );

        console.log(
          "=============================="
        );

        const bases =
          response?.data?.data;

        if (!Array.isArray(bases)) {
          throw new Error(
            "Invalid /api/bases response"
          );
        }

        setAllBases(bases);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "FAILED TO LOAD BASES:",
          err
        );

        console.error(
          "BASE STATUS:",
          err?.response?.status
        );

        console.error(
          "BASE RESPONSE:",
          err?.response?.data
        );

        setAllBases([]);

        setBaseError(
          "Unable to load bases."
        );
      }
    }

    loadBases();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * LOAD EQUIPMENT INDEPENDENTLY
   *
   * A failure here must NOT prevent bases
   * from appearing.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadEquipment() {
      try {
        setEquipmentError("");

        const response =
          await equipmentApi.list();

        if (cancelled) {
          return;
        }

        console.log(
          "====== EQUIPMENT API ======"
        );

        console.log(
          "STATUS:",
          response?.status
        );

        console.log(
          "RAW:",
          response?.data
        );

        console.log(
          "EQUIPMENT DATA:",
          response?.data?.data
        );

        console.log(
          "==========================="
        );

        const equipment =
          response?.data?.data;

        if (!Array.isArray(equipment)) {
          throw new Error(
            "Invalid /api/equipment-types response"
          );
        }

        setEquipmentTypes(equipment);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "FAILED TO LOAD EQUIPMENT:",
          err
        );

        console.error(
          "EQUIPMENT STATUS:",
          err?.response?.status
        );

        console.error(
          "EQUIPMENT RESPONSE:",
          err?.response?.data
        );

        setEquipmentTypes([]);

        setEquipmentError(
          "Unable to load equipment types."
        );
      }
    }

    loadEquipment();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Form loading is complete when the two independent
   * requests have had a chance to complete.
   */
  useEffect(() => {
    /*
     * Small delay isn't needed for correctness, but keeping
     * loading until either data has arrived makes the UI cleaner.
     */
    if (
      allBases.length > 0 ||
      equipmentTypes.length > 0 ||
      baseError ||
      equipmentError
    ) {
      setLoadingForm(false);
    }
  }, [
    allBases,
    equipmentTypes,
    baseError,
    equipmentError,
  ]);

  /*
   * Set source base automatically for commanders.
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
      /*
       * Don't spam console continuously while the bases
       * request is still loading.
       */
      if (!loadingForm) {
        console.error(
          "Commander baseId does not match any loaded base.",
          {
            user,
            commanderBaseId,
            allBases,
          }
        );
      }

      return;
    }

    const sourceId =
      String(commanderBase.id);

    setForm((current) => {
      if (
        String(
          current.sourceBaseId
        ) === sourceId
      ) {
        return current;
      }

      return {
        ...current,
        sourceBaseId: sourceId,
        destinationBaseId: "",
      };
    });
  }, [
    isCommander,
    commanderBaseId,
    commanderBase,
    loadingForm,
    user,
    allBases,
  ]);

  /*
   * Load transfer history separately.
   */
  async function loadTransfers() {
    setLoading(true);

    try {
      const response =
        await transferApi.list();

      const rows =
        response?.data?.data ?? [];

      setTransfers(
        Array.isArray(rows)
          ? rows
          : []
      );
    } catch (err) {
      console.error(
        "FAILED TO LOAD TRANSFERS:",
        err
      );

      setTransfers([]);
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
     * Commander source authorization.
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
        sourceBaseId:
          isCommander
            ? commanderBaseId
            : current.sourceBaseId,
        destinationBaseId: "",
        equipmentTypeId: "",
        quantity: "",
      }));

      await loadTransfers();
    } catch (err) {
      console.error(
        "TRANSFER FAILED:",
        err
      );

      console.error(
        "STATUS:",
        err?.response?.status
      );

      console.error(
        "RESPONSE:",
        err?.response?.data
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
        formatDate(
          row.transferDate
        ),
    },
    {
      key: "sourceBase",
      header: "From",
      render: (row) =>
        row.sourceBase?.name ||
        "—",
    },
    {
      key: "destinationBase",
      header: "To",
      render: (row) =>
        row.destinationBase?.name ||
        "—",
    },
    {
      key: "equipment",
      header: "Equipment",
      render: (row) =>
        row.equipmentType?.name ||
        "—",
    },
    {
      key: "quantity",
      header: "Quantity",
      align: "right",
      mono: true,
      render: (row) =>
        formatNumber(
          row.quantity
        ),
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
        row.createdBy?.username ||
        "—",
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
          executed as a single atomic
          transaction
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
                  setForm(
                    (current) => ({
                      ...current,
                      sourceBaseId:
                        event.target.value,
                      destinationBaseId: "",
                    })
                  )
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
                disabled={
                  loadingForm ||
                  allBases.length === 0
                }
                value={
                  form.destinationBaseId
                }
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      destinationBaseId:
                        event.target.value,
                    })
                  )
                }
                className="form-input"
              >
                <option value="">
                  {loadingForm
                    ? "Loading bases..."
                    : baseError
                      ? "Unable to load bases"
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
                  loadingForm ||
                  equipmentTypes.length === 0
                }
                value={
                  form.equipmentTypeId
                }
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      equipmentTypeId:
                        event.target.value,
                    })
                  )
                }
                className="form-input"
              >
                <option value="">
                  {loadingForm
                    ? "Loading equipment..."
                    : equipmentError
                      ? "Unable to load equipment"
                      : "Select equipment…"}
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
                  setForm(
                    (current) => ({
                      ...current,
                      quantity:
                        event.target.value,
                    })
                  )
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
                  setForm(
                    (current) => ({
                      ...current,
                      transferDate:
                        event.target.value,
                    })
                  )
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

          {baseError && (
            <p className="mt-3 text-sm text-rust-400">
              {baseError}
            </p>
          )}

          {equipmentError && (
            <p className="mt-1 text-sm text-rust-400">
              {equipmentError}
            </p>
          )}

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

function Field({
  label,
  children,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-widest2 text-mist-400">
        {label}
      </span>
      {children}
    </label>
  );
}