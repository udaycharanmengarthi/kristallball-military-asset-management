const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Base",
  tableName: "bases",
  columns: {
    id: { primary: true, type: "int", generated: true },
    name: { type: "varchar", length: 150, unique: true },
    code: { type: "varchar", length: 20, unique: true },
    location: { type: "varchar", length: 200, nullable: true },
    createdAt: { type: "timestamptz", createDate: true },
    updatedAt: { type: "timestamptz", updateDate: true },
  },
});
