import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/http.js";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new AppError(401, "Falta el token de autenticación"));
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as AuthUser;
    req.user = payload;
    next();
  } catch {
    next(new AppError(401, "Token inválido o expirado"));
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, "No autenticado"));
      return;
    }
    if (req.user.role === "ADMIN" || roles.includes(req.user.role)) {
      next();
      return;
    }
    next(new AppError(403, "Tu rol no tiene permiso para esta acción"));
  };
}

/** Lectura permitida a cualquier usuario autenticado; escritura según roles del módulo. */
export function writeRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method === "GET") {
      next();
      return;
    }
    requireRole(...roles)(req, res, next);
  };
}
