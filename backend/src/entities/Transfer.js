const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Transfer",
  tableName: "transfers",
  columns: {
    id: { primary: true, type: "int", generated: true },
    sourceBaseId: { type: "int" },
    destinationBaseId: { type: "int" },
    equipmentTypeId: { type: "int" },
    quantity: { type: "int" },
    transferDate: { type: "date" },
    status: {
      type: "enum",
      enum: ["COMPLETED", "FAILED"],
      default: "COMPLETED",
    },
    createdById: { type: "int" },
    createdAt: { type: "timestamptz", createDate: true },
  },
  relations: {
    sourceBase: {
      type: "many-to-one",
      target: "Base",
      joinColumn: { name: "sourceBaseId" },
    },
    destinationBase: {
      type: "many-to-one",
      target: "Base",
      joinColumn: { name: "destinationBaseId" },
    },
    equipmentType: {
      type: "many-to-one",
      target: "EquipmentType",
      joinColumn: { name: "equipmentTypeId" },
    },
    createdBy: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "createdById" },
    },
  },
  indices: [
    { columns: ["sourceBaseId"] },
    { columns: ["destinationBaseId"] },
    { columns: ["equipmentTypeId"] },
    { columns: ["createdAt"] },
  ],
});
