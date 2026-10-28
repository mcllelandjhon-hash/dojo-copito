import type { Response } from "express";

export class AppError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function ok<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json({ data });
}

export function parsePagination(query: Record<string, unknown>): { page: number; pageSize: number; skip: number; take: number } {
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 20) || 20));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export async function paged<T>(
  res: Response,
  query: Record<string, unknown>,
  countFn: () => Promise<number>,
  findFn: (skip: number, take: number) => Promise<T[]>,
): Promise<Response> {
  const { page, pageSize, skip, take } = parsePagination(query);
  const [total, items] = await Promise.all([countFn(), findFn(skip, take)]);
  return res.json({ data: items, meta: { page, pageSize, total, pages: Math.ceil(total / pageSize) || 1 } });
}

export function searchFilter(term: unknown, fields: string[]): Record<string, unknown> {
  if (!term || typeof term !== "string" || !term.trim()) return {};
  return { OR: fields.map((field) => ({ [field]: { contains: term.trim() } })) };
}
