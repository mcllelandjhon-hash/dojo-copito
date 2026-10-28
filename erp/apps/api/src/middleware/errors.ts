import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/http.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { message: err.message } });
    return;
  }
  if (err instanceof Error) {
    // Errores de reglas de negocio lanzados como Error simple se tratan como 400.
    const known = /Stock insuficiente|supera el saldo|debe ser|cantidad/i.test(err.message);
    res.status(known ? 400 : 500).json({ error: { message: known ? err.message : "Error interno del servidor" } });
    if (!known) console.error(err);
    return;
  }
  res.status(500).json({ error: { message: "Error interno del servidor" } });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: { message: "Recurso no encontrado" } });
}
