import { useCallback, useEffect, useState } from "react";
import { Badge, EmptyState, EntityForm, Modal, PageHead, Toast, useToast } from "../components/ui.js";
import { api } from "../lib/api.js";
import { formatMoney, toCents } from "../lib/format.js";

interface Product {
  id: string; sku: string; name: string; description?: string | null;
  costCents: number; priceCents: number; stock: number; minStock: number; active: boolean;
  category?: { name: string } | null;
}

interface Movement {
  id: string; type: string; quantity: number; reason: string; createdAt: string;
  product?: { sku: string; name: string };
}

export function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [moving, setMoving] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast, show } = useToast();

  const load = useCallback(() => {
    api.list<Product>(`/api/v1/products?pageSize=50&q=${encodeURIComponent(query)}`).then((r) => setItems(r.items)).catch((e: Error) => setError(e.message));
    api.list<Movement>("/api/v1/inventory/movements?pageSize=10").then((r) => setMovements(r.items)).catch(() => undefined);
  }, [query]);

  useEffect(load, [load]);

  async function saveProduct(values: Record<string, string>, id?: string) {
    setError(null);
    const payload = {
      sku: values.sku, name: values.name, description: values.description || null,
      costCents: toCents(values.cost), priceCents: toCents(values.price),
      minStock: Number(values.minStock || 0),
    };
    try {
      if (id) await api.patch(`/api/v1/products/${id}`, payload);
      else await api.post("/api/v1/products", payload);
      setCreating(false); setEditing(null); show("Producto guardado"); load();
    } catch (e) { setError(e instanceof Error ? e.message : "Error al guardar"); }
  }

  async function saveMovement(values: Record<string, string>) {
    if (!moving) return;
    setError(null);
    try {
      await api.post("/api/v1/inventory/movements", {
        productId: moving.id, type: values.type, quantity: Number(values.quantity), reason: values.reason,
      });
      setMoving(null); show("Movimiento registrado"); load();
    } catch (e) { setError(e instanceof Error ? e.message : "Error en el movimiento"); }
  }

  return (
    <>
      <PageHead title="Productos e inventario" subtitle="Precios, costos y stock. El stock cambia solo con movimientos." action={<button className="btn btn-primary" onClick={() => setCreating(true)}>+ Nuevo producto</button>} />
      <div className="toolbar">
        <input className="search" placeholder="Buscar por nombre o SKU…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar productos" />
      </div>
      {items.length === 0 ? <EmptyState text="Sin productos todavía." /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>SKU</th><th>Producto</th><th>Costo</th><th>Precio</th><th>Stock</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className={p.stock <= p.minStock ? "row-alert" : ""}>
                  <td>{p.sku}</td>
                  <td><strong>{p.name}</strong>{p.category ? <span className="cell-sub">{p.category.name}</span> : null}</td>
                  <td>{formatMoney(p.costCents)}</td>
                  <td>{formatMoney(p.priceCents)}</td>
                  <td><strong>{p.stock}</strong> <span className="cell-sub">mín. {p.minStock}</span></td>
                  <td>{p.stock <= p.minStock ? <Badge value="URGENT" /> : <Badge value="CONFIRMED" />}</td>
                  <td className="row-actions">
                    <button className="btn btn-ghost btn-small" onClick={() => setMoving(p)}>Movimiento</button>
                    <button className="btn btn-ghost btn-small" onClick={() => setEditing(p)}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="panel">
        <h3>Últimos movimientos de inventario</h3>
        {movements.length === 0 ? <EmptyState text="Aún no hay movimientos registrados." /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Motivo</th></tr></thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td>{new Date(m.createdAt).toLocaleString("es-PE")}</td>
                    <td>{m.product?.name ?? "—"}</td>
                    <td>{m.type === "IN" ? "Entrada" : m.type === "OUT" ? "Salida" : "Ajuste"}</td>
                    <td>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                    <td>{m.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {(creating || editing) ? (
        <Modal title={editing ? `Editar: ${editing.name}` : "Nuevo producto"} onClose={() => { setCreating(false); setEditing(null); }}>
          <EntityForm
            fields={[
              { name: "sku", label: "SKU", required: true },
              { name: "name", label: "Nombre", required: true },
              { name: "description", label: "Descripción" },
              { name: "cost", label: "Costo (S/)", type: "number", step: "0.01", required: true },
              { name: "price", label: "Precio de venta (S/)", type: "number", step: "0.01", required: true },
              { name: "minStock", label: "Stock mínimo", type: "number" },
            ]}
            initial={editing ? { sku: editing.sku, name: editing.name, description: editing.description ?? "", cost: (editing.costCents / 100).toFixed(2), price: (editing.priceCents / 100).toFixed(2), minStock: editing.minStock } : undefined}
            submitLabel={editing ? "Guardar cambios" : "Crear producto"}
            error={error}
            onSubmit={(values) => saveProduct(values, editing?.id)}
          />
        </Modal>
      ) : null}

      {moving ? (
        <Modal title={`Movimiento: ${moving.name} (stock ${moving.stock})`} onClose={() => setMoving(null)}>
          <EntityForm
            fields={[
              { name: "type", label: "Tipo", required: true, options: [{ value: "IN", label: "Entrada" }, { value: "OUT", label: "Salida" }, { value: "ADJUSTMENT", label: "Ajuste a cantidad exacta" }] },
              { name: "quantity", label: "Cantidad", type: "number", required: true },
              { name: "reason", label: "Motivo", required: true },
            ]}
            submitLabel="Registrar movimiento"
            error={error}
            onSubmit={saveMovement}
          />
        </Modal>
      ) : null}
      <Toast message={toast} />
    </>
  );
}
