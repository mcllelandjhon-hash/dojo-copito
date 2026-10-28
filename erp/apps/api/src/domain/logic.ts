export interface OrderLineInput {
  quantity: number;
  unitAmountCents: number;
}

export interface OrderTotals {
  lines: { quantity: number; unitAmountCents: number; lineTotalCents: number }[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
}

/** Calcula totales con dinero en centavos e impuesto en puntos básicos (1800 = 18%). */
export function computeOrderTotals(lines: OrderLineInput[], taxRateBps = 1800): OrderTotals {
  const computed = lines.map((line) => {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new Error("La cantidad debe ser un entero positivo");
    }
    if (!Number.isInteger(line.unitAmountCents) || line.unitAmountCents < 0) {
      throw new Error("El monto unitario debe ser un entero mayor o igual a cero");
    }
    return {
      quantity: line.quantity,
      unitAmountCents: line.unitAmountCents,
      lineTotalCents: line.quantity * line.unitAmountCents,
    };
  });
  const subtotalCents = computed.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const taxCents = Math.round((subtotalCents * taxRateBps) / 10000);
  return { lines: computed, subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
}

export type InvoicePaymentState = "UNPAID" | "PARTIAL" | "PAID";

export function invoiceStatusAfterPayment(totalCents: number, paidCents: number): InvoicePaymentState {
  if (paidCents <= 0) return "UNPAID";
  if (paidCents >= totalCents) return "PAID";
  return "PARTIAL";
}

export function assertPaymentWithinBalance(totalCents: number, alreadyPaidCents: number, newPaymentCents: number): void {
  if (!Number.isInteger(newPaymentCents) || newPaymentCents <= 0) {
    throw new Error("El pago debe ser un monto positivo");
  }
  if (alreadyPaidCents + newPaymentCents > totalCents) {
    throw new Error("El pago supera el saldo de la factura");
  }
}

export interface StockPosition {
  productId: string;
  stock: number;
}

/** Valida que exista stock para todos los ítems antes de confirmar una venta. */
export function assertSufficientStock(
  required: { productId: string; quantity: number }[],
  positions: StockPosition[],
): void {
  const byId = new Map(positions.map((p) => [p.productId, p.stock]));
  for (const item of required) {
    const available = byId.get(item.productId) ?? 0;
    if (available < item.quantity) {
      throw new Error(`Stock insuficiente para el producto ${item.productId}: hay ${available}, se piden ${item.quantity}`);
    }
  }
}

export type AgingBucket = "CURRENT" | "DAYS_1_30" | "DAYS_31_60" | "DAYS_61_PLUS";

export function agingBucket(dueAt: Date, now = new Date()): AgingBucket {
  const diffDays = Math.floor((now.getTime() - dueAt.getTime()) / 86400000);
  if (diffDays <= 0) return "CURRENT";
  if (diffDays <= 30) return "DAYS_1_30";
  if (diffDays <= 60) return "DAYS_31_60";
  return "DAYS_61_PLUS";
}

export function nextDocumentNumber(prefix: string, sequence: number): string {
  return `${prefix}-${String(sequence).padStart(6, "0")}`;
}
