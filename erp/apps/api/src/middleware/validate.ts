import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "../utils/http.js";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new AppError(400, result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")));
      return;
    }
    req.body = result.data;
    next();
  };
}
