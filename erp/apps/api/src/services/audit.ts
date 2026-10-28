import { prisma } from "../config/prisma.js";
import { nextDocumentNumber } from "../domain/logic.js";

export async function audit(userId: string | undefined, action: string, entity: string, entityId?: string, detail?: string): Promise<void> {
  await prisma.auditLog.create({ data: { userId: userId ?? null, action, entity, entityId: entityId ?? null, detail: detail ?? null } });
}

export async function nextNumber(kind: "sales" | "purchase" | "invoice"): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { id: kind },
    create: { id: kind, value: 1 },
    update: { value: { increment: 1 } },
  });
  const prefix = kind === "sales" ? "PED" : kind === "purchase" ? "OC" : "FAC";
  return nextDocumentNumber(prefix, counter.value);
}
