import { Router, type NextFunction, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAuth, requireRole, signToken } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { audit } from "../services/audit.js";
import { AppError, ok, paged } from "../utils/http.js";

export const authRouter = Router();

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

authRouter.post("/login", validateBody(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) throw new AppError(401, "Credenciales inválidas");
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError(401, "Credenciales inválidas");
    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    await audit(user.id, "LOGIN", "User", user.id);
    ok(res, { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
});

authRouter.get("/me", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, name: true, email: true, role: true, active: true } });
    if (!user) throw new AppError(404, "Usuario no encontrado");
    ok(res, user);
  } catch (err) { next(err); }
});

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  role: z.enum(["ADMIN", "MANAGER", "SALES", "WAREHOUSE", "ACCOUNTING", "HR", "VIEWER"]),
  active: z.boolean().optional(),
});

export const usersRouter = Router();
usersRouter.use(requireRole("ADMIN"));

usersRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await paged(res, req.query as Record<string, unknown>,
      () => prisma.user.count(),
      (skip, take) => prisma.user.findMany({ skip, take, orderBy: { name: "asc" }, select: { id: true, name: true, email: true, role: true, active: true, createdAt: true } }));
  } catch (err) { next(err); }
});

usersRouter.post("/", validateBody(userSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof userSchema>;
    if (!body.password) throw new AppError(400, "La contraseña es obligatoria al crear un usuario");
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: { name: body.name, email: body.email, role: body.role, active: body.active ?? true, passwordHash },
      select: { id: true, name: true, email: true, role: true, active: true },
    });
    await audit(req.user?.id, "CREATE", "User", user.id);
    ok(res, user, 201);
  } catch (err) { next(err); }
});

usersRouter.patch("/:id", validateBody(userSchema.partial()), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as Partial<z.infer<typeof userSchema>>;
    const data: Record<string, unknown> = { ...body };
    if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10);
    delete data.password;
    const user = await prisma.user.update({ where: { id: req.params.id }, data, select: { id: true, name: true, email: true, role: true, active: true } });
    await audit(req.user?.id, "UPDATE", "User", user.id);
    ok(res, user);
  } catch (err) { next(err); }
});
