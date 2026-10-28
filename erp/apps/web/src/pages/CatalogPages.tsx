import { useCallback, useEffect, useState } from "react";
import { EmptyState, EntityForm, Modal, PageHead, Toast, useToast } from "../components/ui.js";
import { api } from "../lib/api.js";

interface Party {
  id: string; name: string; taxId?: string | null; email?: string | null;
  phone?: string | null; address?: string | null; active: boolean;
}

const FIELDS = [
  { name: "name", label: "Nombre o razón social", required: true },
  { name: "taxId", label: "Documento (DNI/RUC)" },
  { name: "email", label: "Correo", type: "email" },
  { name: "phone", label: "Teléfono" },
  { name: "address", label: "Dirección" },
];

function PartyPage({ title, subtitle, endpoint }: { title: string; subtitle: string; endpoint: string }) {
  const [items, setItems] = useState<Party[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Party | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast, show } = useToast();

  const load = useCallback(() => {
    api.list<Party>(`${endpoint}?pageSize=50&q=${encodeURIComponent(query)}`)
      .then((r) => setItems(r.items))
      .catch((e: Error) => setError(e.message));
  }, [endpoint, query]);

  useEffect(load, [load]);

  async function save(values: Record<string, string>, id?: string) {
    setError(null);
    try {
      if (id) await api.patch(`${endpoint}/${id}`, values);
      else await api.post(endpoint, values);
      setCreating(false);
      setEditing(null);
      show(id ? "Registro actualizado" : "Registro creado");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    }
  }

  return (
    <>
      <PageHead title={title} subtitle={subtitle} action={<button className="btn btn-primary" onClick={() => setCreating(true)}>+ Nuevo</button>} />
      <div className="toolbar">
        <input className="search" placeholder="Buscar por nombre, documento o correo…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar" />
      </div>
      {items.length === 0 ? <EmptyState text="Todavía no hay registros. Crea el primero con el botón Nuevo." /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Documento</th><th>Correo</th><th>Teléfono</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong>{item.address ? <span className="cell-sub">{item.address}</span> : null}</td>
                  <td>{item.taxId ?? "—"}</td>
                  <td>{item.email ?? "—"}</td>
                  <td>{item.phone ?? "—"}</td>
                  <td>{item.active ? "Activo" : "Inactivo"}</td>
                  <td><button className="btn btn-ghost btn-small" onClick={() => setEditing(item)}>Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(creating || editing) ? (
        <Modal title={editing ? `Editar: ${editing.name}` : `Nuevo — ${title}`} onClose={() => { setCreating(false); setEditing(null); }}>
          <EntityForm
            fields={FIELDS}
            initial={editing ? (editing as unknown as Record<string, unknown>) : undefined}
            submitLabel={editing ? "Guardar cambios" : "Crear"}
            error={error}
            onSubmit={(values) => save(values, editing?.id)}
          />
        </Modal>
      ) : null}
      <Toast message={toast} />
    </>
  );
}

export function CustomersPage() {
  return <PartyPage title="Clientes" subtitle="Tu cartera de clientes y sus datos de contacto y facturación." endpoint="/api/v1/customers" />;
}

export function SuppliersPage() {
  return <PartyPage title="Proveedores" subtitle="Las empresas que abastecen tu negocio." endpoint="/api/v1/suppliers" />;
}
