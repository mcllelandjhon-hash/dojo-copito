import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { audit } from "../services/audit.js";
import { AppError, ok, paged, searchFilter } from "../utils/http.js";

export const productsRouter = Router();
const write = requireRole("ADMIN", "MANAGER", "WAREHOUSE");

const productSchema = z.object({
  sku: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  costCents: z.number().int().min(0),
  priceCents: z.number().int().min(0),
  minStock: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

productsRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where = { ...searchFilter(req.query.q, ["name", "sku"]) };
    await paged(res, req.query as Record<string, unknown>,
      () => prisma.product.count({ where }),
      (skip, take) => prisma.product.findMany({ where, skip, take, include: { category: true }, orderBy: { name: "asc" } }));
  } catch (err) { next(err); }
});

productsRouter.get("/low-stock", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.product.findMany({ where: { active: true } });
    ok(res, items.filter((p) => p.stock <= p.minStock));
  } catch (err) { next(err); }
});

productsRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await prisma.product.findUnique({ where: { id: req.params.id }, include: { category: true, movements: { orderBy: { createdAt: "desc" }, take: 50 } } });
    if (!item) throw new AppError(404, "Producto no encontrado");
    ok(res, item);
  } catch (err) { next(err); }
});

productsRouter.post("/", write, validateBody(productSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await prisma.product.create({ data: req.body });
    await audit(req.user?.id, "CREATE", "Product", item.id);
    ok(res, item, 201);
  } catch (err) { next(err); }
});

productsRouter.patch("/:id", write, validateBody(productSchema.partial()), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
    await audit(req.user?.id, "UPDATE", "Product", item.id);
    ok(res, item);
  } catch (err) { next(err); }
});

productsRouter.delete("/:id", requireRole("ADMIN", "MANAGER"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    await audit(req.user?.id, "DELETE", "Product", req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

const movementSchema = z.object({
  productId: z.string(),
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  quantity: z.number().int(),
  reason: z.string().min(2),
  reference: z.string().optional().nullable(),
});

export const inventoryRouter = Router();

inventoryRouter.get("/movements", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where = req.query.productId ? { productId: String(req.query.productId) } : {};
    await paged(res, req.query as Record<string, unknown>,
      () => prisma.stockMovement.count({ where }),
      (skip, take) => prisma.stockMovement.findMany({ where, skip, take, include: { product: { select: { sku: true, name: true } } }, orderBy: { createdAt: "desc" } }));
  } catch (err) { next(err); }
});

inventoryRouter.post("/movements", write, validateBody(movementSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof movementSchema>;
    const movement = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: body.productId } });
      if (!product) throw new AppError(404, "Producto no encontrado");
      let delta = body.quantity;
      if (body.type === "OUT") delta = -Math.abs(body.quantity);
      if (body.type === "IN") delta = Math.abs(body.quantity);
      const newStock = body.type === "ADJUSTMENT" ? body.quantity : product.stock + delta;
      if (newStock < 0) throw new AppError(400, "El movimiento dejaría el stock en negativo");
      await tx.product.update({ where: { id: product.id }, data: { stock: newStock } });
      return tx.stockMovement.create({ data: { ...body, quantity: body.type === "ADJUSTMENT" ? body.quantity - product.stock : delta } });
    });
    await audit(req.user?.id, "STOCK_MOVEMENT", "Product", body.productId, body.reason);
    ok(res, movement, 201);
  } catch (err) { next(err); }
});
