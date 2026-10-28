import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { agingBucket, assertPaymentWithinBalance, invoiceStatusAfterPayment } from "../domain/logic.js";
import { requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { audit } from "../services/audit.js";
import { AppError, ok, paged } from "../utils/http.js";

export const invoicesRouter = Router();
const write = requireRole("ADMIN", "MANAGER", "ACCOUNTING");

invoicesRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: Record<string, unknown> = {};
    if (req.query.kind) where.kind = String(req.query.kind);
    if (req.query.status) where.status = String(req.query.status);
    await paged(res, req.query as Record<string, unknown>,
      () => prisma.invoice.count({ where }),
      (skip, take) => prisma.invoice.findMany({ where, skip, take, include: { customer: true, supplier: true, payments: true }, orderBy: { dueAt: "asc" } }));
  } catch (err) { next(err); }
});

invoicesRouter.get("/aging", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kind = req.query.kind === "PAYABLE" ? "PAYABLE" : "RECEIVABLE";
    const open = await prisma.invoice.findMany({ where: { kind, status: { in: ["UNPAID", "PARTIAL"] } } });
    const summary: Record<string, { count: number; balanceCents: number }> = {
      CURRENT: { count: 0, balanceCents: 0 },
      DAYS_1_30: { count: 0, balanceCents: 0 },
      DAYS_31_60: { count: 0, balanceCents: 0 },
      DAYS_61_PLUS: { count: 0, balanceCents: 0 },
    };
    for (const inv of open) {
      const bucket = agingBucket(inv.dueAt);
      summary[bucket].count += 1;
      summary[bucket].balanceCents += inv.totalCents - inv.paidCents;
    }
    ok(res, { kind, buckets: summary });
  } catch (err) { next(err); }
});

invoicesRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: { customer: true, supplier: true, payments: { orderBy: { paidAt: "desc" } }, salesOrder: { include: { items: { include: { product: true } } } }, purchaseOrder: { include: { items: { include: { product: true } } } } } });
    if (!invoice) throw new AppError(404, "Factura no encontrada");
    ok(res, invoice);
  } catch (err) { next(err); }
});

const paymentSchema = z.object({
  amountCents: z.number().int().positive(),
  method: z.string().min(2).default("TRANSFER"),
  reference: z.string().optional().nullable(),
  paidAt: z.coerce.date().optional(),
});

invoicesRouter.post("/:id/payments", write, validateBody(paymentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof paymentSchema>;
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: req.params.id } });
      if (!invoice) throw new AppError(404, "Factura no encontrada");
      if (invoice.status === "VOID") throw new AppError(400, "No se puede pagar una factura anulada");
      assertPaymentWithinBalance(invoice.totalCents, invoice.paidCents, body.amountCents);
      const payment = await tx.payment.create({ data: { invoiceId: invoice.id, amountCents: body.amountCents, method: body.method, reference: body.reference ?? null, paidAt: body.paidAt ?? new Date() } });
      const paidCents = invoice.paidCents + body.amountCents;
      const updated = await tx.invoice.update({ where: { id: invoice.id }, data: { paidCents, status: invoiceStatusAfterPayment(invoice.totalCents, paidCents) }, include: { payments: true } });
      return { payment, invoice: updated };
    });
    await audit(req.user?.id, "PAYMENT", "Invoice", req.params.id, String(body.amountCents));
    ok(res, result, 201);
  } catch (err) { next(err); }
});
