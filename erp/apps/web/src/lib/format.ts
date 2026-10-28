export function formatMoney(cents: number, currency = "S/"): string {
  return `${currency} ${(cents / 100).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function toCents(value: string | number): number {
  const num = typeof value === "string" ? Number(value.replace(",", ".")) : value;
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}

export function formatDate(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  CONFIRMED: "Confirmado",
  FULFILLED: "Entregado",
  RECEIVED: "Recibido",
  CANCELLED: "Cancelado",
  UNPAID: "Por pagar",
  PARTIAL: "Parcial",
  PAID: "Pagado",
  VOID: "Anulada",
  TODO: "Por hacer",
  IN_PROGRESS: "En curso",
  DONE: "Hecha",
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
  INCOME: "Ingreso",
  EXPENSE: "Egreso",
  RECEIVABLE: "Por cobrar",
  PAYABLE: "Por pagar",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
