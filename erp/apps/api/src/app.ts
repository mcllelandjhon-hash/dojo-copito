import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env, isTest } from "./config/env.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { authRouter, usersRouter } from "./routes/auth.js";
import { crudRouter, partial, schemas } from "./routes/crud.js";
import { auditRouter, dashboardRouter, reportsRouter, settingsRouter } from "./routes/dashboard.js";
import { employeesRouter } from "./routes/employees.js";
import { invoicesRouter } from "./routes/invoices.js";
import { inventoryRouter, productsRouter } from "./routes/products.js";
import { purchasesRouter } from "./routes/purchases.js";
import { salesRouter } from "./routes/sales.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()) }));
  app.use(express.json({ limit: "1mb" }));
  if (!isTest) app.use(morgan("dev"));

  app.get("/health", (_req, res) => {
    res.json({ data: { status: "ok", service: "erp-copito-api", timestamp: new Date().toISOString() } });
  });

  app.use("/api/v1/auth", rateLimit({ windowMs: 60_000, limit: 60 }), authRouter);

  app.use("/api/v1", requireAuth);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/dashboard", dashboardRouter);
  app.use("/api/v1/reports", reportsRouter);
  app.use("/api/v1/settings", settingsRouter);
  app.use("/api/v1/audit", auditRouter);
  app.use("/api/v1/customers", crudRouter({ model: "customer", entity: "Customer", searchFields: ["name", "taxId", "email"], writeRoles: ["MANAGER", "SALES"], createSchema: schemas.customer, updateSchema: partial(schemas.customer) }));
  app.use("/api/v1/suppliers", crudRouter({ model: "supplier", entity: "Supplier", searchFields: ["name", "taxId", "email"], writeRoles: ["MANAGER", "ACCOUNTING", "WAREHOUSE"], createSchema: schemas.supplier, updateSchema: partial(schemas.supplier) }));
  app.use("/api/v1/categories", crudRouter({ model: "category", entity: "Category", searchFields: ["name"], writeRoles: ["MANAGER", "WAREHOUSE"], createSchema: schemas.named, updateSchema: partial(schemas.named) }));
  app.use("/api/v1/departments", crudRouter({ model: "department", entity: "Department", searchFields: ["name"], writeRoles: ["MANAGER", "HR"], createSchema: schemas.named, updateSchema: partial(schemas.named) }));
  app.use("/api/v1/finance/transactions", crudRouter({ model: "financeTransaction", entity: "FinanceTransaction", searchFields: ["category", "description"], writeRoles: ["MANAGER", "ACCOUNTING"], createSchema: schemas.financeTransaction, updateSchema: partial(schemas.financeTransaction), orderBy: { occurredAt: "desc" } }));
  app.use("/api/v1/tasks", crudRouter({ model: "task", entity: "Task", searchFields: ["title", "description"], writeRoles: ["MANAGER", "SALES", "WAREHOUSE", "ACCOUNTING", "HR"], createSchema: schemas.task, updateSchema: partial(schemas.task) }));
  app.use("/api/v1/products", productsRouter);
  app.use("/api/v1/inventory", inventoryRouter);
  app.use("/api/v1/sales", salesRouter);
  app.use("/api/v1/purchases", purchasesRouter);
  app.use("/api/v1/invoices", invoicesRouter);
  app.use("/api/v1/employees", employeesRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
