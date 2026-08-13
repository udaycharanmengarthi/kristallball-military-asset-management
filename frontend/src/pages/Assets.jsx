import { useEffect, useState } from "react";
import { assetApi, baseApi, equipmentApi } from "../services/resources";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/DataTable";
import FilterBar from "../components/FilterBar";
import Badge from "../components/Badge";
import { formatNumber, formatDateTime } from "../utils/format";

const CATEGORY_VARIANT = {
  WEAPON: "rust",
  VEHICLE: "steel",
  AMMUNITION: "brass",
  OTHER: "mist",
};

export default function Assets() {
  const { user } = useAuth();
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [filters, setFilters] = useState({});
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    baseApi.list().then((res) => setBases(res.data.data)).catch(() => {});
    equipmentApi.list().then((res) => setEquipmentTypes(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    assetApi
      .list(filters)
      .then((res) => setAssets(res.data.data))
      .catch(() => setError("Unable to load asset inventory."))
      .finally(() => setLoading(false));
  }, [filters]);

  const columns = [
    { key: "base", header: "Base", render: (r) => r.base?.name || "—" },
    {
      key: "equipment",
      header: "Equipment",
      render: (r) => (
        <div className="flex items-center gap-2">
          <span>{r.equipmentType?.name}</span>
          <Badge variant={CATEGORY_VARIANT[r.equipmentType?.category] || "mist"}>
            {r.equipmentType?.category}
          </Badge>
        </div>
      ),
    },
    { key: "openingBalance", header: "Opening", align: "right", mono: true, render: (r) => formatNumber(r.openingBalance) },
    { key: "assignedQuantity", header: "Assigned", align: "right", mono: true, render: (r) => formatNumber(r.assignedQuantity) },
    { key: "expendedQuantity", header: "Expended", align: "right", mono: true, render: (r) => formatNumber(r.expendedQuantity) },
    {
      key: "currentQuantity",
      header: "On Hand",
      align: "right",
      mono: true,
      render: (r) => <span className="font-semibold text-brass-300">{formatNumber(r.currentQuantity)}</span>,
    },
    { key: "updatedAt", header: "Last Updated", render: (r) => formatDateTime(r.updatedAt) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-mist-50">Asset Inventory</h1>
        <p className="mt-0.5 text-sm text-mist-400">Live on-hand quantities by base and equipment type</p>
      </div>

      <FilterBar
        bases={bases}
        equipmentTypes={equipmentTypes}
        filters={filters}
        onChange={setFilters}
        showBaseFilter={user?.role !== "BASE_COMMANDER"}
      />

      <DataTable columns={columns} rows={assets} loading={loading} error={error} emptyMessage="No inventory records match these filters" />
    </div>
  );
}
