require("reflect-metadata");

const { DataSource } = require("typeorm");

const User = require("../entities/User");
const Base = require("../entities/Base");
const EquipmentType = require("../entities/EquipmentType");
const Asset = require("../entities/Asset");
const Purchase = require("../entities/Purchase");
const Transfer = require("../entities/Transfer");
const Assignment = require("../entities/Assignment");
const Expenditure = require("../entities/Expenditure");
const AuditLog = require("../entities/AuditLog");

const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,

  synchronize: true,
  logging: false,

  entities: [
    User,
    Base,
    EquipmentType,
    Asset,
    Purchase,
    Transfer,
    Assignment,
    Expenditure,
    AuditLog,
  ],
});

module.exports = {
  AppDataSource,
};