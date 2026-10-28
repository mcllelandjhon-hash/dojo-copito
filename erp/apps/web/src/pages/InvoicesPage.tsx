import { useCallback, useEffect, useState } from "react";
import { Badge, EmptyState, EntityForm, Modal, PageHead, Toast, useToast } from "../components/ui.js";
import { api } from "../lib/api.js";
import { formatDate, formatMoney, toCents } from "../lib/format.js";

interface Invoice {
  id: string; number: string; kind: string; status: string;
  totalCents: number; paidCents: number; dueAt: string;
  customer?: { name: string } | null; supplier?: { name: string } | null;
}

export function InvoicesPage() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [kind, setKind] = useState("RECEIVABLE");
  const [paying, setPaying] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast, show } = useToast();

  const load = useCallback(() => {
    api.list<Invoice>(`/api/v1/invoices?pageSize=50&kind=${kind}`).then((r) => setItems(r.items)).catch((e: Error) => setError(e.message));
  }, [kind]);

  useEffect(load, [load]);

  async function pay(values: Record<string, string>) {
    if (!paying) return;
    setError(null);
    try {
      await api.post(`/api/v1/invoices/${paying.id}/payments`, { amountCents: toCents(values.amount), method: values.method, reference: values.reference || null });
      setPaying(null);
      show("Pago registrado");
      load();
    } catch (e) { setError(e instanceof Error ? e.message : "Error al pagar"); }
  }

  return (
    <>
      <PageHead title="Facturas y pagos" subtitle="Cuentas por cobrar y por pagar, con pagos parciales o totales." />
      <div className="toolbar">
        <div className="segmented" role="tablist" aria-label="Tipo de factura">
          <button className={kind === "RECEIVABLE" ? "active" : ""} onClick={() => setKind("RECEIVABLE")}>Por cobrar</button>
          <button className={kind === "PAYABLE" ? "active" : ""} onClick={() => setKind("PAYABLE")}>Por pagar</button>
        </div>
      </div>
      {items.length === 0 ? <EmptyState text="No hay facturas de este tipo todavía." /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Número</th><th>Contraparte</th><th>Vence</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {items.map((inv) => (
                <tr key={inv.id}>
                  <td><strong>{inv.number}</strong></td>
                  <td>{inv.customer?.name ?? inv.supplier?.name ?? "—"}</td>
                  <td>{formatDate(inv.dueAt)}</td>
                  <td>{formatMoney(inv.totalCents)}</td>
                  <td>{formatMoney(inv.paidCents)}</td>
                  <td><strong>{formatMoney(inv.totalCents - inv.paidCents)}</strong></td>
                  <td><Badge value={inv.status} /></td>
                  <td>
                    {inv.status === "UNPAID" || inv.status === "PARTIAL" ? (
                      <button className="btn btn-ghost btn-small" onClick={() => setPaying(inv)}>Registrar pago</button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {paying ? (
        <Modal title={`Pago de ${paying.number} — saldo ${formatMoney(paying.totalCents - paying.paidCents)}`} onClose={() => setPaying(null)}>
          <EntityForm
            fields={[
              { name: "amount", label: "Monto (S/)", type: "number", step: "0.01", required: true },
              { name: "method", label: "Método", required: true, options: [{ value: "TRANSFER", label: "Transferencia" }, { value: "YAPE", label: "Yape" }, { value: "CASH", label: "Efectivo" }, { value: "CARD", label: "Tarjeta" }] },
              { name: "reference", label: "Referencia / n.° de operación" },
            ]}
            submitLabel="Registrar pago"
            error={error}
            onSubmit={pay}
          />
        </Modal>
      ) : null}
      <Toast message={toast} />
    </>
  );
}
