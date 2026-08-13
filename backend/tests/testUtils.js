require("reflect-metadata");
process.env.NODE_ENV = "test";
require("dotenv").config();
const bcrypt = require("bcrypt");
const { AppDataSource } = require("../src/config/db");
const User = require("../src/entities/User");
const Base = require("../src/entities/Base");
const EquipmentType = require("../src/entities/EquipmentType");
const Asset = require("../src/entities/Asset");

async function initTestDb() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
}

async function closeTestDb() {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}

/**
 * Wipes all tables between test files so each suite starts from a known,
 * empty state instead of depending on execution order or leftover data.
 */
async function clearAllTables() {
  const entities = AppDataSource.entityMetadatas;
  for (const entity of entities) {
    const repo = AppDataSource.getRepository(entity.name);
    await repo.query(`TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`);
  }
}

async function seedBasicFixtures() {
  const baseRepo = AppDataSource.getRepository(Base);
  const equipmentRepo = AppDataSource.getRepository(EquipmentType);
  const userRepo = AppDataSource.getRepository(User);
  const assetRepo = AppDataSource.getRepository(Asset);

  const alpha = await baseRepo.save(baseRepo.create({ name: "Fort Alpha", code: "FALPHA" }));
  const bravo = await baseRepo.save(baseRepo.create({ name: "Fort Bravo", code: "FBRAVO" }));

  const rifle = await equipmentRepo.save(
    equipmentRepo.create({ name: "Test Rifle", category: "WEAPON", unit: "unit" })
  );

  const adminHash = await bcrypt.hash("AdminPass123!", 4);
  const commanderHash = await bcrypt.hash("CommandPass123!", 4);
  const logisticsHash = await bcrypt.hash("LogisticsPass123!", 4);

  const admin = await userRepo.save(
    userRepo.create({
      username: "test_admin",
      passwordHash: adminHash,
      role: "ADMIN",
      baseId: null,
    })
  );
  const commander = await userRepo.save(
    userRepo.create({
      username: "test_commander",
      passwordHash: commanderHash,
      role: "BASE_COMMANDER",
      baseId: alpha.id,
    })
  );
  const logistics = await userRepo.save(
    userRepo.create({
      username: "test_logistics",
      passwordHash: logisticsHash,
      role: "LOGISTICS_OFFICER",
      baseId: null,
    })
  );

  const asset = await assetRepo.save(
    assetRepo.create({
      baseId: alpha.id,
      equipmentTypeId: rifle.id,
      openingBalance: 100,
      currentQuantity: 100,
    })
  );

  return { alpha, bravo, rifle, admin, commander, logistics, asset };
}

module.exports = { initTestDb, closeTestDb, clearAllTables, seedBasicFixtures };
