import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge, StatCard } from "../src/components/ui.js";

describe("componentes base de UI", () => {
  it("StatCard muestra etiqueta, valor y ayuda", () => {
    render(<StatCard icon="🧾" label="Ventas del mes" value="S/ 100.00" hint="5 pedidos" />);
    expect(screen.getByText("Ventas del mes")).toBeInTheDocument();
    expect(screen.getByText("S/ 100.00")).toBeInTheDocument();
    expect(screen.getByText("5 pedidos")).toBeInTheDocument();
  });

  it("Badge traduce el estado y aplica el tono correcto", () => {
    const { rerender } = render(<Badge value="PAID" />);
    expect(screen.getByText("Pagado")).toHaveClass("badge-ok");
    rerender(<Badge value="CANCELLED" />);
    expect(screen.getByText("Cancelado")).toHaveClass("badge-bad");
  });
});
