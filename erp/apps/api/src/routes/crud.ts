import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { audit } from "../services/audit.js";
import { AppError, ok, paged, searchFilter } from "../utils/http.js";

type ModelName = "customer" | "supplier" | "category" | "department" | "financeTransaction" | "task";

interface CrudOptions {
  model: ModelName;
  entity: string;
  searchFields: string[];
  writeRoles: string[];
  createSchema: z.ZodTypeAny;
  updateSchema: z.ZodTypeAny;
  orderBy?: Record<string, "asc" | "desc">;
}

/** CRUD estándar para entidades simples del ERP. Las entidades con reglas
 *  especiales (productos, pedidos, facturas, empleados) tienen rutas propias. */
export function crudRouter(options: CrudOptions): Router {
  const router = Router();
  // Acceso dinámico al delegado de Prisma según el modelo configurado.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const delegate = (prisma as any)[options.model];

  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const where = { ...searchFilter(req.query.q, options.searchFields) };
      await paged(res, req.query as Record<string, unknown>,
        () => delegate.count({ where }),
        (skip, take) => delegate.findMany({ where, skip, take, orderBy: options.orderBy ?? { createdAt: "desc" } }));
    } catch (err) { next(err); }
  });

  router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await delegate.findUnique({ where: { id: req.params.id } });
      if (!item) throw new AppError(404, `${options.entity} no encontrado`);
      ok(res, item);
    } catch (err) { next(err); }
  });

  router.post("/", requireRole(...options.writeRoles), validateBody(options.createSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await delegate.create({ data: req.body });
      await audit(req.user?.id, "CREATE", options.entity, item.id);
      ok(res, item, 201);
    } catch (err) { next(err); }
  });

  router.patch("/:id", requireRole(...options.writeRoles), validateBody(options.updateSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await delegate.update({ where: { id: req.params.id }, data: req.body });
      await audit(req.user?.id, "UPDATE", options.entity, item.id);
      ok(res, item);
    } catch (err) { next(err); }
  });

  router.delete("/:id", requireRole("ADMIN", "MANAGER"), async (req: Request, res: Response, next: NextFunction) => {
    try {
      await delegate.delete({ where: { id: req.params.id } });
      await audit(req.user?.id, "DELETE", options.entity, req.params.id);
      res.status(204).send();
    } catch (err) { next(err); }
  });

  return router;
}

export const schemas = {
  customer: z.object({
    name: z.string().min(2),
    taxId: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    active: z.boolean().optional(),
    notes: z.string().optional().nullable(),
  }),
  supplier: z.object({
    name: z.string().min(2),
    taxId: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    active: z.boolean().optional(),
    notes: z.string().optional().nullable(),
  }),
  named: z.object({ name: z.string().min(2) }),
  financeTransaction: z.object({
    type: z.enum(["INCOME", "EXPENSE"]),
    category: z.string().min(2),
    description: z.string().min(2),
    amountCents: z.number().int().positive(),
    occurredAt: z.coerce.date().optional(),
  }),
  task: z.object({
    title: z.string().min(2),
    description: z.string().optional().nullable(),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    dueAt: z.coerce.date().optional().nullable(),
    assigneeId: z.string().optional().nullable(),
  }),
};

export function partial<T extends z.ZodTypeAny>(schema: T) {
  return (schema as unknown as z.ZodObject<z.ZodRawShape>).partial();
}
