import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { audit } from "../services/audit.js";
import { AppError, ok, paged, searchFilter } from "../utils/http.js";

export const employeesRouter = Router();
const write = requireRole("ADMIN", "MANAGER", "HR");

const employeeSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  position: z.string().min(2),
  departmentId: z.string().optional().nullable(),
  salaryCents: z.number().int().min(0).optional(),
  hiredAt: z.coerce.date().optional().nullable(),
  active: z.boolean().optional(),
});

employeesRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where = { ...searchFilter(req.query.q, ["firstName", "lastName", "position"]) };
    await paged(res, req.query as Record<string, unknown>,
      () => prisma.employee.count({ where }),
      (skip, take) => prisma.employee.findMany({ where, skip, take, include: { department: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }));
  } catch (err) { next(err); }
});

employeesRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await prisma.employee.findUnique({ where: { id: req.params.id }, include: { department: true } });
    if (!item) throw new AppError(404, "Empleado no encontrado");
    ok(res, item);
  } catch (err) { next(err); }
});

employeesRouter.post("/", write, validateBody(employeeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await prisma.employee.create({ data: req.body, include: { department: true } });
    await audit(req.user?.id, "CREATE", "Employee", item.id);
    ok(res, item, 201);
  } catch (err) { next(err); }
});

employeesRouter.patch("/:id", write, validateBody(employeeSchema.partial()), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await prisma.employee.update({ where: { id: req.params.id }, data: req.body, include: { department: true } });
    await audit(req.user?.id, "UPDATE", "Employee", item.id);
    ok(res, item);
  } catch (err) { next(err); }
});

employeesRouter.delete("/:id", requireRole("ADMIN", "MANAGER"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.employee.delete({ where: { id: req.params.id } });
    await audit(req.user?.id, "DELETE", "Employee", req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});
