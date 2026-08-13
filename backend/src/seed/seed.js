require("reflect-metadata");
require("dotenv").config();

const bcrypt = require("bcrypt");

const { AppDataSource } = require("../config/db");

const Base = require("../entities/Base");
const EquipmentType = require("../entities/EquipmentType");
const User = require("../entities/User");
const Asset = require("../entities/Asset");
const Purchase = require("../entities/Purchase");

async function seed() {
  try {
    await AppDataSource.initialize();

    const baseRepo =
      AppDataSource.getRepository(Base);

    const equipmentRepo =
      AppDataSource.getRepository(EquipmentType);

    const userRepo =
      AppDataSource.getRepository(User);

    const assetRepo =
      AppDataSource.getRepository(Asset);

    const purchaseRepo =
      AppDataSource.getRepository(Purchase);

    // ==================================================
    // BASES
    // ==================================================

    console.log("Seeding bases...");

    const baseDefs = [
      {
        name: "Fort Alpha",
        code: "FALPHA",
        location: "Sector 1",
      },
      {
        name: "Fort Bravo",
        code: "FBRAVO",
        location: "Sector 2",
      },
      {
        name: "Fort Charlie",
        code: "FCHARLIE",
        location: "Sector 3",
      },
    ];

    const bases = {};

    for (const def of baseDefs) {
      let base = await baseRepo.findOne({
        where: {
          code: def.code,
        },
      });

      if (!base) {
        base = baseRepo.create(def);
        base = await baseRepo.save(base);

        console.log(
          `  created base ${def.name}`
        );
      } else {
        base.name = def.name;
        base.location = def.location;

        await baseRepo.save(base);

        console.log(
          `  updated base ${def.name}`
        );
      }

      bases[def.name] = base;
    }

    // ==================================================
    // EQUIPMENT TYPES
    // ==================================================

    console.log(
      "Seeding equipment types..."
    );

    const equipmentDefs = [
      {
        name: "M4 Carbine",
        category: "WEAPON",
        unit: "unit",
      },
      {
        name: "Humvee",
        category: "VEHICLE",
        unit: "unit",
      },
      {
        name: "5.56mm Ammunition",
        category: "AMMUNITION",
        unit: "round",
      },
    ];

    const equipment = {};

    for (const def of equipmentDefs) {
      let eq = await equipmentRepo.findOne({
        where: {
          name: def.name,
        },
      });

      if (!eq) {
        eq = equipmentRepo.create(def);
        eq = await equipmentRepo.save(eq);

        console.log(
          `  created equipment ${def.name}`
        );
      } else {
        eq.category = def.category;
        eq.unit = def.unit;

        await equipmentRepo.save(eq);

        console.log(
          `  updated equipment ${def.name}`
        );
      }

      equipment[def.name] = eq;
    }

    // ==================================================
    // USERS
    // ==================================================

    console.log("Seeding users...");

    const userDefs = [
      {
        username: "admin_user",
        password: "AdminPass123!",
        fullName: "System Administrator",
        role: "ADMIN",
        baseId: null,
      },
      {
        username: "commander_alpha",
        password: "CommandPass123!",
        fullName: "Commander (Fort Alpha)",
        role: "BASE_COMMANDER",
        baseId: bases["Fort Alpha"].id,
      },
      {
        username: "commander_bravo",
        password: "CommandPass123!",
        fullName: "Commander (Fort Bravo)",
        role: "BASE_COMMANDER",
        baseId: bases["Fort Bravo"].id,
      },
      {
        username: "commander_charlie",
        password: "CommandPass123!",
        fullName: "Commander (Fort Charlie)",
        role: "BASE_COMMANDER",
        baseId: bases["Fort Charlie"].id,
      },
      {
        username: "logistics_officer",
        password: "LogisticsPass123!",
        fullName: "Logistics Officer",
        role: "LOGISTICS_OFFICER",
        baseId: null,
      },
    ];

    for (const def of userDefs) {
      const passwordHash =
        await bcrypt.hash(def.password, 10);

      let user = await userRepo.findOne({
        where: {
          username: def.username,
        },
      });

      if (!user) {
        user = userRepo.create({
          username: def.username,
          passwordHash,
          fullName: def.fullName,
          role: def.role,
          baseId: def.baseId,
          isActive: true,
        });

        await userRepo.save(user);

        console.log(
          `  created ${def.username}`
        );
      } else {
        user.passwordHash = passwordHash;
        user.fullName = def.fullName;
        user.role = def.role;
        user.baseId = def.baseId;
        user.isActive = true;

        await userRepo.save(user);

        console.log(
          `  reset ${def.username}`
        );
      }
    }

    // ==================================================
    // DEMO INVENTORY
    // ==================================================

    console.log(
      "Seeding demo inventory..."
    );

    const inventoryDefs = [
      {
        base: "Fort Alpha",
        equipment: "M4 Carbine",
        opening: 500,
        quantity: 500,
      },
      {
        base: "Fort Alpha",
        equipment: "Humvee",
        opening: 20,
        quantity: 20,
      },
      {
        base: "Fort Alpha",
        equipment: "5.56mm Ammunition",
        opening: 50000,
        quantity: 50000,
      },
      {
        base: "Fort Bravo",
        equipment: "M4 Carbine",
        opening: 300,
        quantity: 300,
      },
      {
        base: "Fort Bravo",
        equipment: "Humvee",
        opening: 12,
        quantity: 12,
      },
      {
        base: "Fort Bravo",
        equipment: "5.56mm Ammunition",
        opening: 30000,
        quantity: 30000,
      },
      {
        base: "Fort Charlie",
        equipment: "M4 Carbine",
        opening: 150,
        quantity: 150,
      },
      {
        base: "Fort Charlie",
        equipment: "Humvee",
        opening: 8,
        quantity: 8,
      },
      {
        base: "Fort Charlie",
        equipment: "5.56mm Ammunition",
        opening: 15000,
        quantity: 15000,
      },
    ];

    for (const def of inventoryDefs) {
      const baseEntity =
        bases[def.base];

      const equipmentEntity =
        equipment[def.equipment];

      if (!baseEntity) {
        throw new Error(
          `Base not found: ${def.base}`
        );
      }

      if (!equipmentEntity) {
        throw new Error(
          `Equipment not found: ${def.equipment}`
        );
      }

      let asset =
        await assetRepo.findOne({
          where: {
            baseId: baseEntity.id,
            equipmentTypeId:
              equipmentEntity.id,
          },
        });

      if (!asset) {
        asset = assetRepo.create({
          baseId: baseEntity.id,
          equipmentTypeId:
            equipmentEntity.id,
          openingBalance: def.opening,
          currentQuantity: def.quantity,
        });

        await assetRepo.save(asset);

        console.log(
          `  created inventory ${def.base} / ${def.equipment}`
        );
      }
    }

    // ==================================================
    // SAMPLE PURCHASE
    // ==================================================

    console.log(
      "Seeding sample purchase..."
    );

    const adminUser =
      await userRepo.findOne({
        where: {
          username: "admin_user",
        },
      });

    if (!adminUser) {
      throw new Error(
        "admin_user was not created"
      );
    }

    const existingPurchase =
      await purchaseRepo.findOne({
        where: {
          baseId:
            bases["Fort Alpha"].id,
          equipmentTypeId:
            equipment["M4 Carbine"].id,
        },
      });

    if (!existingPurchase) {
      await purchaseRepo.save(
        purchaseRepo.create({
          baseId:
            bases["Fort Alpha"].id,
          equipmentTypeId:
            equipment["M4 Carbine"].id,
          quantity: 50,
          purchaseDate:
            new Date()
              .toISOString()
              .slice(0, 10),
          createdById:
            adminUser.id,
        })
      );

      const asset =
        await assetRepo.findOne({
          where: {
            baseId:
              bases["Fort Alpha"].id,
            equipmentTypeId:
              equipment["M4 Carbine"].id,
          },
        });

      if (!asset) {
        throw new Error(
          "Fort Alpha M4 Carbine inventory not found"
        );
      }

      asset.currentQuantity += 50;

      await assetRepo.save(asset);
    }

    console.log("Seed complete.");
  } catch (error) {
    console.error(
      "Seed failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seed();