import { describe, expect, it } from "vitest";
import { formatDate, formatMoney, statusLabel, toCents } from "../src/lib/format.js";

describe("formatMoney", () => {
  it("formatea centavos como soles con dos decimales", () => {
    expect(formatMoney(4500)).toContain("45.00");
    expect(formatMoney(0)).toContain("0.00");
    expect(formatMoney(123456)).toContain("1,234.56");
  });
});

describe("toCents", () => {
  it("convierte montos escritos a centavos enteros", () => {
    expect(toCents("45")).toBe(4500);
    expect(toCents("45,50")).toBe(4550);
    expect(toCents(19.99)).toBe(1999);
    expect(toCents("no-numero")).toBe(0);
  });
});

describe("statusLabel y formatDate", () => {
  it("traduce estados del ERP al español", () => {
    expect(statusLabel("CONFIRMED")).toBe("Confirmado");
    expect(statusLabel("PARTIAL")).toBe("Parcial");
    expect(statusLabel("RECEIVABLE")).toBe("Por cobrar");
  });

  it("formatea fechas ISO", () => {
    expect(formatDate("2026-10-27T15:00:00.000Z")).toMatch(/2026/);
  });
});
