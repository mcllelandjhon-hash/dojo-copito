import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { audit } from "../services/audit.js";
import { ok } from "../utils/http.js";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [salesMonth, purchasesMonth, openReceivables, openPayables, products, lowStockCount, customersCount, employeesCount, incomeMonth, expenseMonth] = await Promise.all([
      prisma.salesOrder.aggregate({ _sum: { totalCents: true }, _count: true, where: { status: { in: ["CONFIRMED", "FULFILLED"] }, createdAt: { gte: monthStart } } }),
      prisma.purchaseOrder.aggregate({ _sum: { totalCents: true }, _count: true, where: { status: "RECEIVED", createdAt: { gte: monthStart } } }),
      prisma.invoice.findMany({ where: { kind: "RECEIVABLE", status: { in: ["UNPAID", "PARTIAL"] } } }),
      prisma.invoice.findMany({ where: { kind: "PAYABLE", status: { in: ["UNPAID", "PARTIAL"] } } }),
      prisma.product.findMany({ where: { active: true } }),
      prisma.product.count({ where: { active: true } }),
      prisma.customer.count({ where: { active: true } }),
      prisma.employee.count({ where: { active: true } }),
      prisma.financeTransaction.aggregate({ _sum: { amountCents: true }, where: { type: "INCOME", occurredAt: { gte: monthStart } } }),
      prisma.financeTransaction.aggregate({ _sum: { amountCents: true }, where: { type: "EXPENSE", occurredAt: { gte: monthStart } } }),
    ]);
    const receivablesCents = openReceivables.reduce((s, i) => s + (i.totalCents - i.paidCents), 0);
    const payablesCents = openPayables.reduce((s, i) => s + (i.totalCents - i.paidCents), 0);
    const inventoryValueCents = products.reduce((s, p) => s + p.stock * p.costCents, 0);
    const lowStock = products.filter((p) => p.stock <= p.minStock).length;
    ok(res, {
      salesMonthCents: salesMonth._sum.totalCents ?? 0,
      salesMonthCount: salesMonth._count,
      purchasesMonthCents: purchasesMonth._sum.totalCents ?? 0,
      purchasesMonthCount: purchasesMonth._count,
      receivablesCents,
      payablesCents,
      inventoryValueCents,
      productsCount: lowStockCount,
      lowStockCount: lowStock,
      customersCount,
      employeesCount,
      otherIncomeMonthCents: incomeMonth._sum.amountCents ?? 0,
      otherExpenseMonthCents: expenseMonth._sum.amountCents ?? 0,
      cashFlowMonthCents: (salesMonth._sum.totalCents ?? 0) + (incomeMonth._sum.amountCents ?? 0) - (purchasesMonth._sum.totalCents ?? 0) - (expenseMonth._sum.amountCents ?? 0),
    });
  } catch (err) { next(err); }
});

export const reportsRouter = Router();

reportsRouter.get("/top-products", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.salesOrderItem.groupBy({ by: ["productId"], _sum: { quantity: true, lineTotalCents: true }, orderBy: { _sum: { lineTotalCents: "desc" } }, take: 10 });
    const products = await prisma.product.findMany({ where: { id: { in: items.map((i) => i.productId) } } });
    const byId = new Map(products.map((p) => [p.id, p]));
    ok(res, items.map((i) => ({ product: byId.get(i.productId), quantity: i._sum.quantity ?? 0, grossCents: i._sum.lineTotalCents ?? 0 })));
  } catch (err) { next(err); }
});

reportsRouter.get("/sales-by-month", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await prisma.salesOrder.findMany({ where: { status: { in: ["CONFIRMED", "FULFILLED"] } }, select: { totalCents: true, createdAt: true } });
    const byMonth = new Map<string, number>();
    for (const order of orders) {
      const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, "0")}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + order.totalCents);
    }
    ok(res, Array.from(byMonth.entries()).sort().map(([month, totalCents]) => ({ month, totalCents })));
  } catch (err) { next(err); }
});

reportsRouter.get("/inventory-valuation", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({ where: { active: true }, include: { category: true } });
    ok(res, {
      totalCostValueCents: products.reduce((s, p) => s + p.stock * p.costCents, 0),
      totalPriceValueCents: products.reduce((s, p) => s + p.stock * p.priceCents, 0),
      items: products.map((p) => ({ id: p.id, sku: p.sku, name: p.name, category: p.category?.name ?? null, stock: p.stock, costValueCents: p.stock * p.costCents })),
    });
  } catch (err) { next(err); }
});

export const settingsRouter = Router();

settingsRouter.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await prisma.companySettings.upsert({ where: { id: "default" }, create: { id: "default" }, update: {} });
    ok(res, settings);
  } catch (err) { next(err); }
});

const settingsSchema = z.object({
  legalName: z.string().min(2),
  tradeName: z.string().min(2),
  taxId: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  currency: z.string().length(3),
  taxRateBps: z.number().int().min(0).max(10000),
});

settingsRouter.put("/", requireRole("ADMIN"), validateBody(settingsSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await prisma.companySettings.upsert({ where: { id: "default" }, create: { id: "default", ...req.body }, update: req.body });
    await audit(req.user?.id, "UPDATE", "CompanySettings", "default");
    ok(res, settings);
  } catch (err) { next(err); }
});

export const auditRouter = Router();
auditRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.auditLog.findMany({ take: 100, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, email: true } } } });
    ok(res, logs);
    void req;
  } catch (err) { next(err); }
});
