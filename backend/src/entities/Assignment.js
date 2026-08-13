const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Assignment",
  tableName: "assignments",
  columns: {
    id: { primary: true, type: "int", generated: true },
    baseId: { type: "int" },
    equipmentTypeId: { type: "int" },
    quantity: { type: "int" },
    assignee: { type: "varchar", length: 150 },
    assignmentDate: { type: "date" },
    createdById: { type: "int" },
    createdAt: { type: "timestamptz", createDate: true },
  },
  relations: {
    base: { type: "many-to-one", target: "Base", joinColumn: { name: "baseId" } },
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
    { columns: ["baseId"] },
    { columns: ["equipmentTypeId"] },
    { columns: ["createdAt"] },
  ],
});
