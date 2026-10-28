import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, PageHead, StatCard } from "../components/ui.js";
import { api } from "../lib/api.js";
import { formatMoney } from "../lib/format.js";

interface Summary {
  salesMonthCents: number; salesMonthCount: number;
  purchasesMonthCents: number; purchasesMonthCount: number;
  receivablesCents: number; payablesCents: number;
  inventoryValueCents: number; productsCount: number; lowStockCount: number;
  customersCount: number; employeesCount: number;
  cashFlowMonthCents: number;
}

interface LowStockItem { id: string; sku: string; name: string; stock: number; minStock: number }

export function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Summary>("/api/v1/dashboard/summary").then(setSummary).catch((e: Error) => setError(e.message));
    api.list<LowStockItem>("/api/v1/products/low-stock?pageSize=8").then((r) => setLowStock(r.items)).catch(() => undefined);
  }, []);

  return (
    <>
      <PageHead title="Panel general" subtitle="El pulso de tu empresa este mes." />
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {!summary && !error ? <EmptyState text="Cargando indicadores…" /> : null}
      {summary ? (
        <>
          <div className="stats-grid">
            <StatCard icon="🧾" label="Ventas del mes" value={formatMoney(summary.salesMonthCents)} hint={`${summary.salesMonthCount} pedidos confirmados`} />
            <StatCard icon="🛒" label="Compras del mes" value={formatMoney(summary.purchasesMonthCents)} hint={`${summary.purchasesMonthCount} órdenes recibidas`} />
            <StatCard icon="💳" label="Por cobrar" value={formatMoney(summary.receivablesCents)} hint="Facturas abiertas de clientes" />
            <StatCard icon="🏦" label="Por pagar" value={formatMoney(summary.payablesCents)} hint="Facturas abiertas a proveedores" />
            <StatCard icon="📦" label="Valor del inventario" value={formatMoney(summary.inventoryValueCents)} hint={`${summary.productsCount} productos activos`} />
            <StatCard icon="🔁" label="Flujo neto del mes" value={formatMoney(summary.cashFlowMonthCents)} hint="Ventas + otros ingresos − compras − otros egresos" />
            <StatCard icon="👥" label="Clientes activos" value={String(summary.customersCount)} />
            <StatCard icon="🧑‍🤝‍🧑" label="Empleados activos" value={String(summary.employeesCount)} />
          </div>
          <section className="panel">
            <div className="panel-head">
              <h3>⚠️ Alertas de stock bajo</h3>
              <Link className="btn btn-ghost btn-small" to="/productos">Ver inventario</Link>
            </div>
            {lowStock.length === 0 ? <EmptyState text="Sin alertas: ningún producto está en su stock mínimo." /> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>SKU</th><th>Producto</th><th>Stock</th><th>Mínimo</th></tr></thead>
                  <tbody>
                    {lowStock.map((p) => (
                      <tr key={p.id}><td>{p.sku}</td><td>{p.name}</td><td><strong>{p.stock}</strong></td><td>{p.minStock}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </>
  );
}
