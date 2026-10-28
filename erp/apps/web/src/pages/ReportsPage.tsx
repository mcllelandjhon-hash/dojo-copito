import { useEffect, useState } from "react";
import { EmptyState, PageHead } from "../components/ui.js";
import { api } from "../lib/api.js";
import { formatMoney } from "../lib/format.js";

interface TopProduct { product?: { sku: string; name: string }; quantity: number; grossCents: number }
interface MonthSale { month: string; totalCents: number }
interface Aging { kind: string; buckets: Record<string, { count: number; balanceCents: number }> }

const BUCKET_LABELS: Record<string, string> = {
  CURRENT: "Al día / por vencer",
  DAYS_1_30: "Vencido 1–30 días",
  DAYS_31_60: "Vencido 31–60 días",
  DAYS_61_PLUS: "Vencido +60 días",
};

export function ReportsPage() {
  const [top, setTop] = useState<TopProduct[]>([]);
  const [months, setMonths] = useState<MonthSale[]>([]);
  const [aging, setAging] = useState<Aging | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<TopProduct[]>("/api/v1/reports/top-products").then(setTop).catch((e: Error) => setError(e.message));
    api.get<MonthSale[]>("/api/v1/reports/sales-by-month").then(setMonths).catch(() => undefined);
    api.get<Aging>("/api/v1/invoices/aging?kind=RECEIVABLE").then(setAging).catch(() => undefined);
  }, []);

  const maxMonth = Math.max(1, ...months.map((m) => m.totalCents));

  return (
    <>
      <PageHead title="Reportes" subtitle="Lo que más se vende, cómo van las ventas por mes y qué tan vieja es la deuda de clientes." />
      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <section className="panel">
        <h3>🏆 Productos más vendidos</h3>
        {top.length === 0 ? <EmptyState text="Aún no hay ventas registradas en pedidos." /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Producto</th><th>Unidades</th><th>Venta bruta (sin IGV)</th></tr></thead>
              <tbody>
                {top.map((row, idx) => (
                  <tr key={idx}><td><strong>{row.product?.name ?? "—"}</strong> <span className="cell-sub">{row.product?.sku}</span></td><td>{row.quantity}</td><td>{formatMoney(row.grossCents)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h3>📈 Ventas por mes (con IGV)</h3>
        {months.length === 0 ? <EmptyState text="Sin ventas confirmadas todavía." /> : (
          <div className="bars">
            {months.map((m) => (
              <div className="bar-row" key={m.month}>
                <span className="bar-label">{m.month}</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round((m.totalCents / maxMonth) * 100)}%` }} /></div>
                <span className="bar-value">{formatMoney(m.totalCents)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h3>⏳ Antigüedad de cuentas por cobrar</h3>
        {!aging ? <EmptyState text="Cargando…" /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Tramo</th><th>Facturas</th><th>Saldo</th></tr></thead>
              <tbody>
                {Object.entries(aging.buckets).map(([bucket, data]) => (
                  <tr key={bucket}><td>{BUCKET_LABELS[bucket] ?? bucket}</td><td>{data.count}</td><td>{formatMoney(data.balanceCents)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
