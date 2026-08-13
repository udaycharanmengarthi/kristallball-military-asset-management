const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Asset",
  tableName: "assets",
  columns: {
    id: { primary: true, type: "int", generated: true },
    baseId: { type: "int" },
    equipmentTypeId: { type: "int" },
    // Baseline quantity recorded when tracking started for this base+equipment pair.
    openingBalance: { type: "int", default: 0 },
    // Denormalized running balance = openingBalance + net movement - assigned - expended.
    currentQuantity: { type: "int", default: 0 },
    assignedQuantity: { type: "int", default: 0 },
    expendedQuantity: { type: "int", default: 0 },
    createdAt: { type: "timestamptz", createDate: true },
    updatedAt: { type: "timestamptz", updateDate: true },
  },
  relations: {
    base: {
      type: "many-to-one",
      target: "Base",
      joinColumn: { name: "baseId" },
      onDelete: "CASCADE",
    },
    equipmentType: {
      type: "many-to-one",
      target: "EquipmentType",
      joinColumn: { name: "equipmentTypeId" },
      onDelete: "CASCADE",
    },
  },
  indices: [
    { columns: ["baseId"] },
    { columns: ["equipmentTypeId"] },
    { columns: ["baseId", "equipmentTypeId"], unique: true },
  ],
});
