const request = require("supertest");
const app = require("../src/app");
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

describe("Authentication", () => {
  test("correct credentials log in successfully", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "test_admin", password: "AdminPass123!" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe("ADMIN");
  });

  test("incorrect password is rejected", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "test_admin", password: "wrongpassword" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("unknown username is rejected with the same generic message", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "nobody", password: "whatever" });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid username or password");
  });

  test("missing/invalid token is rejected on protected routes", async () => {
    const res = await request(app).get("/api/assets");
    expect(res.status).toBe(401);

    const res2 = await request(app).get("/api/assets").set("Authorization", "Bearer not-a-real-token");
    expect(res2.status).toBe(401);
  });

  test("passwordHash is never present in any auth response", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "test_admin", password: "AdminPass123!" });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
  });
});

describe("RBAC and base scoping", () => {
  test("Admin has global access to all bases' assets", async () => {
    const token = await loginAs("test_admin", "AdminPass123!");
    const res = await request(app).get("/api/assets").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test("Base Commander only sees their own base's assets", async () => {
    const token = await loginAs("test_commander", "CommandPass123!");
    const res = await request(app).get("/api/assets").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    for (const asset of res.body.data) {
      expect(asset.baseId).toBe(fixtures.alpha.id);
    }
  });

  test("Base Commander cannot bypass scoping via a spoofed baseId query param", async () => {
    const token = await loginAs("test_commander", "CommandPass123!");
    const res = await request(app)
      .get(`/api/assets?baseId=${fixtures.bravo.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    for (const asset of res.body.data) {
      expect(asset.baseId).not.toBe(fixtures.bravo.id);
    }
  });

  test("Base Commander accessing another base directly gets 403", async () => {
    const token = await loginAs("test_commander", "CommandPass123!");
    const res = await request(app)
      .get(`/api/bases/${fixtures.bravo.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test("Base Commander can still see all bases in the list (e.g. to pick a transfer destination), even though detailed single-base access to another base is blocked", async () => {
    const token = await loginAs("test_commander", "CommandPass123!");
    const res = await request(app).get("/api/bases").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    const baseIds = res.body.data.map((b) => b.id);
    expect(baseIds).toEqual(expect.arrayContaining([fixtures.alpha.id, fixtures.bravo.id]));
  });

  test("Logistics Officer (no fixed base) can view all bases", async () => {
    const token = await loginAs("test_logistics", "LogisticsPass123!");
    const res = await request(app).get("/api/bases").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  test("Logistics Officer cannot create assignments (view-only per RBAC matrix)", async () => {
    const token = await loginAs("test_logistics", "LogisticsPass123!");
    const res = await request(app)
      .post("/api/assignments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifle.id,
        quantity: 1,
        assignee: "Test Person",
        assignmentDate: "2026-08-12",
      });
    expect(res.status).toBe(403);
  });

  test("list responses never leak passwordHash for the createdBy user", async () => {
    const adminToken = await loginAs("test_admin", "AdminPass123!");
    await request(app)
      .post("/api/purchases")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        baseId: fixtures.alpha.id,
        equipmentTypeId: fixtures.rifle.id,
        quantity: 10,
        purchaseDate: "2026-08-12",
      });

    const res = await request(app)
      .get("/api/purchases")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
  });
});
