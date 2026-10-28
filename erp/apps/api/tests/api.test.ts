import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "file:./test.db";
process.env.JWT_SECRET = "test-secret-para-pruebas";

const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let app: ReturnType<typeof import("../src/app.js").createApp>;
let prisma: typeof import("../src/config/prisma.js").prisma;
let adminToken = "";
let viewerToken = "";

beforeAll(async () => {
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: apiDir,
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "pipe",
  });
  ({ prisma } = await import("../src/config/prisma.js"));
  const { createApp } = await import("../src/app.js");
  app = createApp();

  // Limpieza en orden seguro para claves foráneas
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.financeTransaction.deleteMany();
  await prisma.task.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.counter.deleteMany();

  const hash = await bcrypt.hash("Admin123!", 10);
  await prisma.user.create({ data: { name: "Admin Test", email: "admin@test.local", passwordHash: hash, role: "ADMIN" } });
  await prisma.user.create({ data: { name: "Viewer Test", email: "viewer@test.local", passwordHash: hash, role: "VIEWER" } });
  await prisma.companySettings.upsert({ where: { id: "default" }, create: { id: "default", taxRateBps: 1800 }, update: { taxRateBps: 1800 } });
});

describe("salud y autenticación", () => {
  it("GET /health responde ok sin token", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ok");
  });

  it("rechaza el acceso sin token", async () => {
    const res = await request(app).get("/api/v1/customers");
    expect(res.status).toBe(401);
  });

  it("rechaza credenciales incorrectas y acepta las correctas", async () => {
    const bad = await request(app).post("/api/v1/auth/login").send({ email: "admin@test.local", password: "ClaveMala123" });
    expect(bad.status).toBe(401);

    const good = await request(app).post("/api/v1/auth/login").send({ email: "admin@test.local", password: "Admin123!" });
    expect(good.status).toBe(200);
    adminToken = good.body.data.token;
    expect(adminToken).toBeTruthy();

    const viewer = await request(app).post("/api/v1/auth/login").send({ email: "viewer@test.local", password: "Admin123!" });
    viewerToken = viewer.body.data.token;
  });

  it("un VIEWER no puede crear clientes", async () => {
    const res = await request(app).post("/api/v1/customers").set("Authorization", `Bearer ${viewerToken}`).send({ name: "No Debe Pasar SAC" });
    expect(res.status).toBe(403);
  });
});

describe("flujo comercial completo: stock → venta → factura → pagos", () => {
  let customerId = "";
  let productId = "";
  let salesOrderId = "";
  let invoiceId = "";

  it("crea cliente y producto, e ingresa stock por movimiento", async () => {
    const customer = await request(app).post("/api/v1/customers").set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Cliente Integración SAC", taxId: "20101010101", email: "demo@cliente.pe" });
    expect(customer.status).toBe(201);
    customerId = customer.body.data.id;

    const product = await request(app).post("/api/v1/products").set("Authorization", `Bearer ${adminToken}`)
      .send({ sku: "INT-001", name: "Producto integración", costCents: 5000, priceCents: 10000, minStock: 2 });
    expect(product.status).toBe(201);
    productId = product.body.data.id;
    expect(product.body.data.stock).toBe(0);

    const movement = await request(app).post("/api/v1/inventory/movements").set("Authorization", `Bearer ${adminToken}`)
      .send({ productId, type: "IN", quantity: 10, reason: "Stock inicial de prueba" });
    expect(movement.status).toBe(201);

    const after = await request(app).get(`/api/v1/products/${productId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(after.body.data.stock).toBe(10);
  });

  it("crea el pedido, lo confirma, descuenta stock y genera la factura", async () => {
    const order = await request(app).post("/api/v1/sales").set("Authorization", `Bearer ${adminToken}`)
      .send({ customerId, items: [{ productId, quantity: 2 }] });
    expect(order.status).toBe(201);
    salesOrderId = order.body.data.id;
    expect(order.body.data.totalCents).toBe(23600); // 20000 + 18% IGV

    const confirmed = await request(app).post(`/api/v1/sales/${salesOrderId}/confirm`).set("Authorization", `Bearer ${adminToken}`);
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.data.status).toBe("CONFIRMED");
    invoiceId = confirmed.body.data.invoice.id;

    const productAfter = await request(app).get(`/api/v1/products/${productId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(productAfter.body.data.stock).toBe(8);
  });

  it("no confirma un pedido sin stock suficiente y no altera el stock", async () => {
    const order = await request(app).post("/api/v1/sales").set("Authorization", `Bearer ${adminToken}`)
      .send({ customerId, items: [{ productId, quantity: 99 }] });
    expect(order.status).toBe(201);
    const confirmed = await request(app).post(`/api/v1/sales/${order.body.data.id}/confirm`).set("Authorization", `Bearer ${adminToken}`);
    expect(confirmed.status).toBe(400);
    const productAfter = await request(app).get(`/api/v1/products/${productId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(productAfter.body.data.stock).toBe(8);
  });

  it("registra pagos parcial y total, y rechaza sobrepagos", async () => {
    const overpay = await request(app).post(`/api/v1/invoices/${invoiceId}/payments`).set("Authorization", `Bearer ${adminToken}`)
      .send({ amountCents: 999999 });
    expect(overpay.status).toBe(400);

    const partial = await request(app).post(`/api/v1/invoices/${invoiceId}/payments`).set("Authorization", `Bearer ${adminToken}`)
      .send({ amountCents: 10000, method: "YAPE" });
    expect(partial.status).toBe(201);
    expect(partial.body.data.invoice.status).toBe("PARTIAL");

    const rest = await request(app).post(`/api/v1/invoices/${invoiceId}/payments`).set("Authorization", `Bearer ${adminToken}`)
      .send({ amountCents: 13600, method: "TRANSFER" });
    expect(rest.status).toBe(201);
    expect(rest.body.data.invoice.status).toBe("PAID");
  });

  it("el dashboard refleja la venta del mes", async () => {
    const res = await request(app).get("/api/v1/dashboard/summary").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.salesMonthCents).toBe(23600);
    expect(res.body.data.receivablesCents).toBe(0);
  });
});
