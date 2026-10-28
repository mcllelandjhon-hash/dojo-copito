import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { assertSufficientStock, computeOrderTotals } from "../domain/logic.js";
import { requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { audit, nextNumber } from "../services/audit.js";
import { AppError, ok, paged } from "../utils/http.js";

export const salesRouter = Router();
const write = requireRole("ADMIN", "MANAGER", "SALES");

const createSchema = z.object({
  customerId: z.string(),
  notes: z.string().optional().nullable(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    unitPriceCents: z.number().int().min(0).optional(),
  })).min(1),
});

async function settings() {
  return prisma.companySettings.upsert({ where: { id: "default" }, create: { id: "default" }, update: {} });
}

salesRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: Record<string, unknown> = {};
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.customerId) where.customerId = String(req.query.customerId);
    await paged(res, req.query as Record<string, unknown>,
      () => prisma.salesOrder.count({ where }),
      (skip, take) => prisma.salesOrder.findMany({ where, skip, take, include: { customer: true, items: true }, orderBy: { createdAt: "desc" } }));
  } catch (err) { next(err); }
});

salesRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id }, include: { customer: true, items: { include: { product: true } }, invoice: true } });
    if (!order) throw new AppError(404, "Pedido de venta no encontrado");
    ok(res, order);
  } catch (err) { next(err); }
});

salesRouter.post("/", write, validateBody(createSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof createSchema>;
    const cfg = await settings();
    const products = await prisma.product.findMany({ where: { id: { in: body.items.map((i) => i.productId) } } });
    if (products.length !== new Set(body.items.map((i) => i.productId)).size) throw new AppError(400, "Algún producto no existe");
    const byId = new Map(products.map((p) => [p.id, p]));
    const totals = computeOrderTotals(
      body.items.map((i) => ({ quantity: i.quantity, unitAmountCents: i.unitPriceCents ?? byId.get(i.productId)!.priceCents })),
      cfg.taxRateBps,
    );
    const number = await nextNumber("sales");
    const order = await prisma.salesOrder.create({
      data: {
        number, customerId: body.customerId, notes: body.notes ?? null,
        subtotalCents: totals.subtotalCents, taxCents: totals.taxCents, totalCents: totals.totalCents,
        items: { create: totals.lines.map((line, idx) => ({ productId: body.items[idx].productId, quantity: line.quantity, unitPriceCents: line.unitAmountCents, lineTotalCents: line.lineTotalCents })) },
      },
      include: { customer: true, items: true },
    });
    await audit(req.user?.id, "CREATE", "SalesOrder", order.id, number);
    ok(res, order, 201);
  } catch (err) { next(err); }
});

salesRouter.post("/:id/confirm", write, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // El correlativo se genera fuera de la transacción para no bloquear SQLite.
    const invoiceNumber = await nextNumber("invoice");
    const order = await prisma.$transaction(async (tx) => {
      const current = await tx.salesOrder.findUnique({ where: { id: req.params.id }, include: { items: true } });
      if (!current) throw new AppError(404, "Pedido de venta no encontrado");
      if (current.status !== "DRAFT") throw new AppError(400, `Solo se confirma un pedido en borrador (estado actual: ${current.status})`);
      const products = await tx.product.findMany({ where: { id: { in: current.items.map((i) => i.productId) } } });
      assertSufficientStock(current.items, products.map((p) => ({ productId: p.id, stock: p.stock })));
      for (const item of current.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
        await tx.stockMovement.create({ data: { productId: item.productId, type: "OUT", quantity: -item.quantity, reason: `Venta ${current.number}`, reference: current.id } });
      }
      await tx.invoice.create({
        data: {
          number: invoiceNumber, kind: "RECEIVABLE", customerId: current.customerId, salesOrderId: current.id,
          totalCents: current.totalCents, dueAt: new Date(Date.now() + 30 * 86400000),
        },
      });
      return tx.salesOrder.update({ where: { id: current.id }, data: { status: "CONFIRMED" }, include: { customer: true, items: true, invoice: true } });
    });
    await audit(req.user?.id, "CONFIRM", "SalesOrder", order.id, order.number);
    ok(res, order);
  } catch (err) { next(err); }
});

salesRouter.post("/:id/fulfill", write, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const current = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!current) throw new AppError(404, "Pedido de venta no encontrado");
    if (current.status !== "CONFIRMED") throw new AppError(400, "Solo se entrega un pedido confirmado");
    const order = await prisma.salesOrder.update({ where: { id: current.id }, data: { status: "FULFILLED" } });
    await audit(req.user?.id, "FULFILL", "SalesOrder", order.id, order.number);
    ok(res, order);
  } catch (err) { next(err); }
});

salesRouter.post("/:id/cancel", write, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.$transaction(async (tx) => {
      const current = await tx.salesOrder.findUnique({ where: { id: req.params.id }, include: { items: true, invoice: true } });
      if (!current) throw new AppError(404, "Pedido de venta no encontrado");
      if (current.status === "CANCELLED") throw new AppError(400, "El pedido ya está cancelado");
      if (current.status === "CONFIRMED" || current.status === "FULFILLED") {
        for (const item of current.items) {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
          await tx.stockMovement.create({ data: { productId: item.productId, type: "IN", quantity: item.quantity, reason: `Cancelación ${current.number}`, reference: current.id } });
        }
      }
      if (current.invoice && current.invoice.paidCents === 0) {
        await tx.invoice.update({ where: { id: current.invoice.id }, data: { status: "VOID" } });
      }
      return tx.salesOrder.update({ where: { id: current.id }, data: { status: "CANCELLED" } });
    });
    await audit(req.user?.id, "CANCEL", "SalesOrder", order.id, order.number);
    ok(res, order);
  } catch (err) { next(err); }
});
