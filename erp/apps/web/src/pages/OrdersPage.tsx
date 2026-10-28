import { useCallback, useEffect, useState } from "react";
import { Badge, EmptyState, Modal, PageHead, Toast, useToast } from "../components/ui.js";
import { api } from "../lib/api.js";
import { formatDate, formatMoney } from "../lib/format.js";

export interface OrderItem { productId: string; quantity: number; product?: { name: string; sku: string } }
export interface Order {
  id: string; number: string; status: string; totalCents: number; subtotalCents: number; taxCents: number;
  createdAt: string; items: OrderItem[];
  customer?: { name: string }; supplier?: { name: string };
  invoice?: { id: string; number: string; status: string } | null;
}
export interface PartyOption { id: string; name: string }
export interface ProductOption { id: string; name: string; sku: string; priceCents: number; costCents: number; stock: number }

interface OrdersConfig {
  title: string;
  subtitle: string;
  endpoint: string;
  partyEndpoint: string;
  partyLabel: string;
  partyField: "customerId" | "supplierId";
  priceField: "priceCents" | "costCents";
  actions: { key: string; label: string; path: string }[];
}

export function OrdersPage(config: OrdersConfig) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [parties, setParties] = useState<PartyOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [creating, setCreating] = useState(false);
  const [partyId, setPartyId] = useState("");
  const [lines, setLines] = useState<{ productId: string; quantity: number }[]>([{ productId: "", quantity: 1 }]);
  const [error, setError] = useState<string | null>(null);
  const { toast, show } = useToast();

  const load = useCallback(() => {
    api.list<Order>(`${config.endpoint}?pageSize=50`).then((r) => setOrders(r.items)).catch((e: Error) => setError(e.message));
  }, [config.endpoint]);

  useEffect(load, [load]);
  useEffect(() => {
    api.list<PartyOption>(`${config.partyEndpoint}?pageSize=100`).then((r) => setParties(r.items)).catch(() => undefined);
    api.list<ProductOption>("/api/v1/products?pageSize=100").then((r) => setProducts(r.items)).catch(() => undefined);
  }, [config.partyEndpoint]);

  async function createOrder() {
    setError(null);
    const items = lines.filter((l) => l.productId).map((l) => ({ productId: l.productId, quantity: l.quantity }));
    if (!partyId || items.length === 0) { setError("Elige la contraparte y al menos un producto."); return; }
    try {
      await api.post(config.endpoint, { [config.partyField]: partyId, items });
      setCreating(false);
      setPartyId("");
      setLines([{ productId: "", quantity: 1 }]);
      show("Documento creado en borrador");
      load();
    } catch (e) { setError(e instanceof Error ? e.message : "Error al crear"); }
  }

  async function runAction(order: Order, path: string, label: string) {
    setError(null);
    try {
      await api.post(`${config.endpoint}/${order.id}/${path}`);
      show(`${order.number}: ${label}`);
      load();
    } catch (e) { setError(e instanceof Error ? e.message : "La acción falló"); }
  }

  return (
    <>
      <PageHead title={config.title} subtitle={config.subtitle} action={<button className="btn btn-primary" onClick={() => setCreating(true)}>+ Nuevo</button>} />
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {orders.length === 0 ? <EmptyState text="Todavía no hay documentos. Crea el primero." /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Número</th><th>{config.partyLabel}</th><th>Fecha</th><th>Ítems</th><th>Total</th><th>Estado</th><th>Factura</th><th></th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td><strong>{order.number}</strong></td>
                  <td>{order.customer?.name ?? order.supplier?.name ?? "—"}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>{order.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td>{formatMoney(order.totalCents)}</td>
                  <td><Badge value={order.status} /></td>
                  <td>{order.invoice ? `${order.invoice.number}` : "—"}</td>
                  <td className="row-actions">
                    {config.actions.map((action) => (
                      <button key={action.key} className="btn btn-ghost btn-small" onClick={() => runAction(order, action.path, action.label)}>{action.label}</button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating ? (
        <Modal title={`Nuevo — ${config.title}`} onClose={() => setCreating(false)}>
          <div className="form">
            <label className="field">
              <span>{config.partyLabel} *</span>
              <select value={partyId} onChange={(e) => setPartyId(e.target.value)}>
                <option value="">Selecciona…</option>
                {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            {lines.map((line, idx) => (
              <div className="line-row" key={idx}>
                <select value={line.productId} onChange={(e) => { const copy = [...lines]; copy[idx].productId = e.target.value; setLines(copy); }} aria-label="Producto">
                  <option value="">Producto…</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name} (stock {p.stock}, {formatMoney(p[config.priceField])})</option>)}
                </select>
                <input type="number" min={1} value={line.quantity} onChange={(e) => { const copy = [...lines]; copy[idx].quantity = Math.max(1, Number(e.target.value) || 1); setLines(copy); }} aria-label="Cantidad" />
                <button type="button" className="icon-btn" aria-label="Quitar línea" onClick={() => setLines(lines.filter((_, i) => i !== idx))}>✕</button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setLines([...lines, { productId: "", quantity: 1 }])}>+ Agregar línea</button>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button className="btn btn-primary" onClick={createOrder}>Crear en borrador</button>
          </div>
        </Modal>
      ) : null}
      <Toast message={toast} />
    </>
  );
}
