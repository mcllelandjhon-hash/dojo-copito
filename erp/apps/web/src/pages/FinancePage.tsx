import { useCallback, useEffect, useState } from "react";
import { Badge, EmptyState, EntityForm, Modal, PageHead, StatCard, Toast, useToast } from "../components/ui.js";
import { api } from "../lib/api.js";
import { formatDate, formatMoney, toCents } from "../lib/format.js";

interface Tx { id: string; type: string; category: string; description: string; amountCents: number; occurredAt: string }

export function FinancePage() {
  const [items, setItems] = useState<Tx[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast, show } = useToast();

  const load = useCallback(() => {
    api.list<Tx>("/api/v1/finance/transactions?pageSize=50").then((r) => setItems(r.items)).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const income = items.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amountCents, 0);
  const expense = items.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amountCents, 0);

  async function save(values: Record<string, string>) {
    setError(null);
    try {
      await api.post("/api/v1/finance/transactions", { type: values.type, category: values.category, description: values.description, amountCents: toCents(values.amount) });
      setCreating(false); show("Movimiento registrado"); load();
    } catch (e) { setError(e instanceof Error ? e.message : "Error al guardar"); }
  }

  return (
    <>
      <PageHead title="Finanzas" subtitle="Ingresos y egresos fuera de ventas y compras: planillas, servicios, alquileres y más." action={<button className="btn btn-primary" onClick={() => setCreating(true)}>+ Nuevo movimiento</button>} />
      <div className="stats-grid stats-grid-3">
        <StatCard icon="⬆️" label="Otros ingresos (lista)" value={formatMoney(income)} />
        <StatCard icon="⬇️" label="Otros egresos (lista)" value={formatMoney(expense)} />
        <StatCard icon="⚖️" label="Neto" value={formatMoney(income - expense)} />
      </div>
      {items.length === 0 ? <EmptyState text="Sin movimientos registrados." /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th>Monto</th></tr></thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id}>
                  <td>{formatDate(t.occurredAt)}</td>
                  <td><Badge value={t.type} /></td>
                  <td>{t.category}</td>
                  <td>{t.description}</td>
                  <td className={t.type === "INCOME" ? "money-in" : "money-out"}>{t.type === "INCOME" ? "+" : "−"} {formatMoney(t.amountCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {creating ? (
        <Modal title="Nuevo movimiento financiero" onClose={() => setCreating(false)}>
          <EntityForm
            fields={[
              { name: "type", label: "Tipo", required: true, options: [{ value: "INCOME", label: "Ingreso" }, { value: "EXPENSE", label: "Egreso" }] },
              { name: "category", label: "Categoría", required: true },
              { name: "description", label: "Descripción", required: true },
              { name: "amount", label: "Monto (S/)", type: "number", step: "0.01", required: true },
            ]}
            submitLabel="Registrar"
            error={error}
            onSubmit={save}
          />
        </Modal>
      ) : null}
      <Toast message={toast} />
    </>
  );
}
