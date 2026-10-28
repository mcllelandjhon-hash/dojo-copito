import { describe, expect, it } from "vitest";
import {
  agingBucket,
  assertPaymentWithinBalance,
  assertSufficientStock,
  computeOrderTotals,
  invoiceStatusAfterPayment,
  nextDocumentNumber,
} from "../src/domain/logic.js";

describe("computeOrderTotals", () => {
  it("calcula subtotal, IGV 18% y total en centavos", () => {
    const totals = computeOrderTotals([
      { quantity: 2, unitAmountCents: 10000 },
      { quantity: 1, unitAmountCents: 5000 },
    ]);
    expect(totals.subtotalCents).toBe(25000);
    expect(totals.taxCents).toBe(4500);
    expect(totals.totalCents).toBe(29500);
    expect(totals.lines[0].lineTotalCents).toBe(20000);
  });

  it("rechaza cantidades no positivas", () => {
    expect(() => computeOrderTotals([{ quantity: 0, unitAmountCents: 100 }])).toThrow(/cantidad/i);
  });
});

describe("invoiceStatusAfterPayment y assertPaymentWithinBalance", () => {
  it("deriva UNPAID, PARTIAL y PAID según lo pagado", () => {
    expect(invoiceStatusAfterPayment(10000, 0)).toBe("UNPAID");
    expect(invoiceStatusAfterPayment(10000, 4000)).toBe("PARTIAL");
    expect(invoiceStatusAfterPayment(10000, 10000)).toBe("PAID");
  });

  it("rechaza pagos que superan el saldo", () => {
    expect(() => assertPaymentWithinBalance(10000, 9000, 2000)).toThrow(/supera el saldo/i);
    expect(() => assertPaymentWithinBalance(10000, 9000, 1000)).not.toThrow();
  });
});

describe("assertSufficientStock", () => {
  it("pasa cuando hay stock y falla cuando falta", () => {
    expect(() => assertSufficientStock([{ productId: "p1", quantity: 3 }], [{ productId: "p1", stock: 5 }])).not.toThrow();
    expect(() => assertSufficientStock([{ productId: "p1", quantity: 6 }], [{ productId: "p1", stock: 5 }])).toThrow(/Stock insuficiente/i);
  });
});

describe("agingBucket y nextDocumentNumber", () => {
  it("clasifica vencimientos por antigüedad", () => {
    const now = new Date("2026-10-27T12:00:00Z");
    expect(agingBucket(new Date("2026-10-28T12:00:00Z"), now)).toBe("CURRENT");
    expect(agingBucket(new Date("2026-10-10T12:00:00Z"), now)).toBe("DAYS_1_30");
    expect(agingBucket(new Date("2026-09-10T12:00:00Z"), now)).toBe("DAYS_31_60");
    expect(agingBucket(new Date("2026-06-01T12:00:00Z"), now)).toBe("DAYS_61_PLUS");
  });

  it("formatea números de documento con ceros", () => {
    expect(nextDocumentNumber("PED", 42)).toBe("PED-000042");
  });
});
