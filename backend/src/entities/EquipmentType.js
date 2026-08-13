const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "EquipmentType",
  tableName: "equipment_types",
  columns: {
    id: { primary: true, type: "int", generated: true },
    name: { type: "varchar", length: 150, unique: true },
    category: {
      type: "enum",
      enum: ["VEHICLE", "WEAPON", "AMMUNITION", "OTHER"],
      default: "OTHER",
    },
    unit: { type: "varchar", length: 30, default: "unit" },
    createdAt: { type: "timestamptz", createDate: true },
    updatedAt: { type: "timestamptz", updateDate: true },
  },
});
