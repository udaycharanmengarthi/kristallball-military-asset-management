const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "User",
  tableName: "users",
  columns: {
    id: { primary: true, type: "int", generated: true },
    username: { type: "varchar", length: 100, unique: true },
    passwordHash: { type: "varchar", length: 255 },
    fullName: { type: "varchar", length: 150, nullable: true },
    role: {
      type: "enum",
      enum: ["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"],
    },
    baseId: { type: "int", nullable: true },
    isActive: { type: "boolean", default: true },
    createdAt: { type: "timestamptz", createDate: true },
    updatedAt: { type: "timestamptz", updateDate: true },
  },
  relations: {
    base: {
      type: "many-to-one",
      target: "Base",
      joinColumn: { name: "baseId" },
      nullable: true,
      onDelete: "SET NULL",
    },
  },
  indices: [{ columns: ["baseId"] }, { columns: ["role"] }],
});
