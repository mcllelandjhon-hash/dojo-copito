import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { computeOrderTotals } from "../domain/logic.js";
import { requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { audit, nextNumber } from "../services/audit.js";
import { AppError, ok, paged } from "../utils/http.js";

export const purchasesRouter = Router();
const write = requireRole("ADMIN", "MANAGER", "WAREHOUSE", "ACCOUNTING");

const createSchema = z.object({
  supplierId: z.string(),
  notes: z.string().optional().nullable(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    unitCostCents: z.number().int().min(0).optional(),
  })).min(1),
});

purchasesRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: Record<string, unknown> = {};
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.supplierId) where.supplierId = String(req.query.supplierId);
    await paged(res, req.query as Record<string, unknown>,
      () => prisma.purchaseOrder.count({ where }),
      (skip, take) => prisma.purchaseOrder.findMany({ where, skip, take, include: { supplier: true, items: true }, orderBy: { createdAt: "desc" } }));
  } catch (err) { next(err); }
});

purchasesRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id }, include: { supplier: true, items: { include: { product: true } }, invoice: true } });
    if (!order) throw new AppError(404, "Orden de compra no encontrada");
    ok(res, order);
  } catch (err) { next(err); }
});

purchasesRouter.post("/", write, validateBody(createSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof createSchema>;
    const cfg = await prisma.companySettings.upsert({ where: { id: "default" }, create: { id: "default" }, update: {} });
    const products = await prisma.product.findMany({ where: { id: { in: body.items.map((i) => i.productId) } } });
    if (products.length !== new Set(body.items.map((i) => i.productId)).size) throw new AppError(400, "Algún producto no existe");
    const byId = new Map(products.map((p) => [p.id, p]));
    const totals = computeOrderTotals(
      body.items.map((i) => ({ quantity: i.quantity, unitAmountCents: i.unitCostCents ?? byId.get(i.productId)!.costCents })),
      cfg.taxRateBps,
    );
    const number = await nextNumber("purchase");
    const order = await prisma.purchaseOrder.create({
      data: {
        number, supplierId: body.supplierId, notes: body.notes ?? null,
        subtotalCents: totals.subtotalCents, taxCents: totals.taxCents, totalCents: totals.totalCents,
        items: { create: totals.lines.map((line, idx) => ({ productId: body.items[idx].productId, quantity: line.quantity, unitCostCents: line.unitAmountCents, lineTotalCents: line.lineTotalCents })) },
      },
      include: { supplier: true, items: true },
    });
    await audit(req.user?.id, "CREATE", "PurchaseOrder", order.id, number);
    ok(res, order, 201);
  } catch (err) { next(err); }
});

purchasesRouter.post("/:id/receive", write, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // El correlativo se genera fuera de la transacción para no bloquear SQLite.
    const invoiceNumber = await nextNumber("invoice");
    const order = await prisma.$transaction(async (tx) => {
      const current = await tx.purchaseOrder.findUnique({ where: { id: req.params.id }, include: { items: true } });
      if (!current) throw new AppError(404, "Orden de compra no encontrada");
      if (current.status !== "DRAFT" && current.status !== "CONFIRMED") throw new AppError(400, `No se puede recibir una orden en estado ${current.status}`);
      for (const item of current.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        await tx.stockMovement.create({ data: { productId: item.productId, type: "IN", quantity: item.quantity, reason: `Compra ${current.number}`, reference: current.id } });
      }
      await tx.invoice.create({
        data: {
          number: invoiceNumber, kind: "PAYABLE", supplierId: current.supplierId, purchaseOrderId: current.id,
          totalCents: current.totalCents, dueAt: new Date(Date.now() + 30 * 86400000),
        },
      });
      return tx.purchaseOrder.update({ where: { id: current.id }, data: { status: "RECEIVED" }, include: { supplier: true, items: true, invoice: true } });
    });
    await audit(req.user?.id, "RECEIVE", "PurchaseOrder", order.id, order.number);
    ok(res, order);
  } catch (err) { next(err); }
});

purchasesRouter.post("/:id/cancel", write, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const current = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id } });
    if (!current) throw new AppError(404, "Orden de compra no encontrada");
    if (current.status === "RECEIVED") throw new AppError(400, "Una orden recibida no se puede cancelar desde aquí");
    const order = await prisma.purchaseOrder.update({ where: { id: current.id }, data: { status: "CANCELLED" } });
    await audit(req.user?.id, "CANCEL", "PurchaseOrder", order.id, order.number);
    ok(res, order);
  } catch (err) { next(err); }
});
