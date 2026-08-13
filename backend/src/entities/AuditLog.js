const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "AuditLog",
  tableName: "audit_logs",
  columns: {
    id: { primary: true, type: "int", generated: true },
    userId: { type: "int", nullable: true },
    action: {
      type: "enum",
      enum: [
        "LOGIN",
        "PURCHASE",
        "TRANSFER",
        "ASSIGNMENT",
        "EXPENDITURE",
        "CREATE_EQUIPMENT",
        "CREATE_BASE",
        "UPDATE_ASSET",
      ],
    },
    baseId: { type: "int", nullable: true },
    details: { type: "text" },
    createdAt: { type: "timestamptz", createDate: true },
  },
  relations: {
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "userId" },
      nullable: true,
      onDelete: "SET NULL",
    },
  },
  indices: [
    { columns: ["userId"] },
    { columns: ["action"] },
    { columns: ["baseId"] },
    { columns: ["createdAt"] },
  ],
});
