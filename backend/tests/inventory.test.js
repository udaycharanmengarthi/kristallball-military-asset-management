const request = require("supertest");
const app = require("../src/app");
const { AppDataSource } = require("../src/config/db");
const Asset = require("../src/entities/Asset");
const { initTestDb, closeTestDb, clearAllTables, seedBasicFixtures } = require("./testUtils");

let fixtures;

beforeAll(async () => {
  await initTestDb();
});

afterAll(async () => {
  await closeTestDb();
});

beforeEach(async () => {
  await clearAllTables();
  fixtures = await seedBasicFixtures();
});

async function loginAs(username, password) {
  const res = await request(app).post("/api/auth/login").send({ username, password });
  return res.body.data.token;
}

async function getAssetQty(baseId, equipmentTypeId) {
  const repo = AppDataSource.getRepository(Asset);
  const asset = await repo.findOne({ where: { baseId, equipmentTypeId } });
  return asset.currentQuantity;
}

describe("Purchases", () => {
  test("valid purchase increases inventory and returns 201", async () => {
    const token = await loginAs("test_admin", "AdminPass123!");
    const res = await request(app)
      .post("/api/purchases")
      .set("Authorization", `Bearer ${token}`)
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifle.id,
        quantity: 25,
        purchaseDate: "2026-08-12",
      });
    expect(res.status).toBe(201);

    const qty = await getAssetQty(fixtures.alpha.id, fixtures.rifle.id);
    expect(qty).toBe(125); // 100 opening + 25 purchased
  });

  test("invalid (zero/negative) quantity is rejected", async () => {
    const token = await loginAs("test_admin", "AdminPass123!");
    const res = await request(app)
      .post("/api/purchases")
      .set("Authorization", `Bearer ${token}`)
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifle.id,
        quantity: -5,
        purchaseDate: "2026-08-12",
      });
    expect(res.status).toBe(400);
  });
});

describe("Transfers", () => {
  test("valid transfer moves quantity atomically between bases", async () => {
    const token = await loginAs("test_admin", "AdminPass123!");
    const res = await request(app)
      .post("/api/transfers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        sourceBaseId: fixtures.alpha.id,
        destinationBaseId: fixtures.bravo.id,
        equipmentTypeId: fixtures.rifle.id,
        quantity: 40,
        transferDate: "2026-08-12",
      });
    expect(res.status).toBe(201);

    const sourceQty = await getAssetQty(fixtures.alpha.id, fixtures.rifle.id);
    const destQty = await getAssetQty(fixtures.bravo.id, fixtures.rifle.id);
    expect(sourceQty).toBe(60); // 100 - 40
    expect(destQty).toBe(40); // 0 + 40
  });

  test("insufficient inventory is rejected and leaves balances untouched", async () => {
    const token = await loginAs("test_admin", "AdminPass123!");
    const res = await request(app)
      .post("/api/transfers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        sourceBaseId: fixtures.alpha.id,
        destinationBaseId: fixtures.bravo.id,
        equipmentTypeId: fixtures.rifle.id,
        quantity: 99999,
        transferDate: "2026-08-12",
      });
    expect(res.status).toBe(409);

    const sourceQty = await getAssetQty(fixtures.alpha.id, fixtures.rifle.id);
    expect(sourceQty).toBe(100); // unchanged
  });

  test("same source and destination base is rejected", async () => {
    const token = await loginAs("test_admin", "AdminPass123!");
    const res = await request(app)
      .post("/api/transfers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        sourceBaseId: fixtures.alpha.id,
        destinationBaseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifle.id,
        quantity: 5,
        transferDate: "2026-08-12",
      });
    expect(res.status).toBe(400);
  });

  test("a failed transfer never partially applies (no destination credit without source debit)", async () => {
    const token = await loginAs("test_admin", "AdminPass123!");
    // Attempt an over-large transfer that must fail validation inside the
    // transaction after the source lock is acquired.
    await request(app)
      .post("/api/transfers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        sourceBaseId: fixtures.alpha.id,
        destinationBaseId: fixtures.bravo.id,
        equipmentTypeId: fixtures.rifle.id,
        quantity: 5000,
        transferDate: "2026-08-12",
      });

    const sourceQty = await getAssetQty(fixtures.alpha.id, fixtures.rifle.id);
    const repo = AppDataSource.getRepository(Asset);
    const destAsset = await repo.findOne({
      where: { baseId: fixtures.bravo.id, equipmentTypeId: fixtures.rifle.id },
    });
    expect(sourceQty).toBe(100); // untouched
    expect(destAsset).toBeNull(); // destination asset row was never created/credited
  });

  test("Base Commander can only transfer out of their own base", async () => {
    const token = await loginAs("test_commander", "CommandPass123!");

    // Attempt to transfer FROM Bravo (not their base) - should be blocked.
    const badRes = await request(app)
      .post("/api/transfers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        sourceBaseId: fixtures.bravo.id,
        destinationBaseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifle.id,
        quantity: 5,
        transferDate: "2026-08-12",
      });
    expect(badRes.status).toBe(403);

    // Transfer FROM their own base (Alpha) - should succeed.
    const goodRes = await request(app)
      .post("/api/transfers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        sourceBaseId: fixtures.alpha.id,
        destinationBaseId: fixtures.bravo.id,
        equipmentTypeId: fixtures.rifle.id,
        quantity: 5,
        transferDate: "2026-08-12",
      });
    expect(goodRes.status).toBe(201);
  });
});

describe("Assignments", () => {
  test("valid assignment reduces available inventory", async () => {
    const token = await loginAs("test_admin", "AdminPass123!");
    const res = await request(app)
      .post("/api/assignments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifle.id,
        quantity: 30,
        assignee: "Cpl. Diaz",
        assignmentDate: "2026-08-12",
      });
    expect(res.status).toBe(201);
    const qty = await getAssetQty(fixtures.alpha.id, fixtures.rifle.id);
    expect(qty).toBe(70);
  });

  test("insufficient inventory for assignment is rejected", async () => {
    const token = await loginAs("test_admin", "AdminPass123!");
    const res = await request(app)
      .post("/api/assignments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifle.id,
        quantity: 99999,
        assignee: "Cpl. Diaz",
        assignmentDate: "2026-08-12",
      });
    expect(res.status).toBe(409);
  });
});

describe("Expenditures", () => {
  test("valid expenditure reduces available inventory", async () => {
    const token = await loginAs("test_admin", "AdminPass123!");
    const res = await request(app)
      .post("/api/expenditures")
      .set("Authorization", `Bearer ${token}`)
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifle.id,
        quantity: 10,
        reason: "Live-fire drill",
        expenditureDate: "2026-08-12",
      });
    expect(res.status).toBe(201);
    const qty = await getAssetQty(fixtures.alpha.id, fixtures.rifle.id);
    expect(qty).toBe(90);
  });

  test("insufficient inventory for expenditure is rejected", async () => {
    const token = await loginAs("test_admin", "AdminPass123!");
    const res = await request(app)
      .post("/api/expenditures")
      .set("Authorization", `Bearer ${token}`)
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifle.id,
        quantity: 99999,
        reason: "Live-fire drill",
        expenditureDate: "2026-08-12",
      });
    expect(res.status).toBe(409);
  });
});

describe("Audit logging", () => {
  test("every mutation creates a matching audit entry", async () => {
    const token = await loginAs("test_admin", "AdminPass123!");

    await request(app)
      .post("/api/purchases")
      .set("Authorization", `Bearer ${token}`)
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifle.id,
        quantity: 5,
        purchaseDate: "2026-08-12",
      });

    await request(app)
      .post("/api/transfers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        sourceBaseId: fixtures.alpha.id,
        destinationBaseId: fixtures.bravo.id,
        equipmentTypeId: fixtures.rifle.id,
        quantity: 5,
        transferDate: "2026-08-12",
      });

    const res = await request(app)
      .get("/api/audit-logs")
      .set("Authorization", `Bearer ${token}`);

    const actions = res.body.data.map((l) => l.action);
    expect(actions).toEqual(expect.arrayContaining(["LOGIN", "PURCHASE", "TRANSFER"]));
  });
});
