import { useEffect, useState } from "react";
import { EmptyState, EntityForm, PageHead, Toast, useToast } from "../components/ui.js";
import { api, getUser } from "../lib/api.js";
import { formatDate } from "../lib/format.js";

interface Settings {
  legalName: string; tradeName: string; taxId: string; email: string; phone: string; address: string; currency: string; taxRateBps: number;
}
interface UserRow { id: string; name: string; email: string; role: string; active: boolean }
interface AuditRow { id: string; action: string; entity: string; detail?: string | null; createdAt: string; user?: { name: string } | null }

export function SettingsPage() {
  const me = getUser();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast, show } = useToast();

  useEffect(() => {
    api.get<Settings>("/api/v1/settings").then(setSettings).catch((e: Error) => setError(e.message));
    if (me?.role === "ADMIN") {
      api.list<UserRow>("/api/v1/users?pageSize=50").then((r) => setUsers(r.items)).catch(() => undefined);
      api.get<AuditRow[]>("/api/v1/audit").then(setAudit).catch(() => undefined);
    }
  }, [me?.role]);

  async function saveSettings(values: Record<string, string>) {
    setError(null);
    try {
      const updated = await api.put<Settings>("/api/v1/settings", {
        legalName: values.legalName, tradeName: values.tradeName, taxId: values.taxId,
        email: values.email, phone: values.phone, address: values.address,
        currency: values.currency.toUpperCase(), taxRateBps: Math.round(Number(values.taxRate || "18") * 100),
      });
      setSettings(updated);
      show("Ajustes guardados");
    } catch (e) { setError(e instanceof Error ? e.message : "Error al guardar"); }
  }

  async function createUser(values: Record<string, string>) {
    setError(null);
    try {
      await api.post("/api/v1/users", values);
      const r = await api.list<UserRow>("/api/v1/users?pageSize=50");
      setUsers(r.items);
      show("Usuario creado");
    } catch (e) { setError(e instanceof Error ? e.message : "Error al crear usuario"); }
  }

  return (
    <>
      <PageHead title="Ajustes" subtitle="Datos de la empresa, usuarios del sistema y auditoría." />
      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <section className="panel">
        <h3>🏢 Datos de la empresa</h3>
        {!settings ? <EmptyState text="Cargando…" /> : (
          <EntityForm
            fields={[
              { name: "legalName", label: "Razón social", required: true },
              { name: "tradeName", label: "Nombre comercial", required: true },
              { name: "taxId", label: "RUC" },
              { name: "email", label: "Correo", type: "email" },
              { name: "phone", label: "Teléfono" },
              { name: "address", label: "Dirección" },
              { name: "currency", label: "Moneda (ISO)", required: true },
              { name: "taxRate", label: "Impuesto % (IGV)", type: "number", step: "0.01", required: true },
            ]}
            initial={{ ...settings, taxRate: (settings.taxRateBps / 100).toString() }}
            submitLabel="Guardar ajustes"
            onSubmit={saveSettings}
          />
        )}
      </section>

      {me?.role === "ADMIN" ? (
        <>
          <section className="panel">
            <h3>👤 Usuarios del sistema</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}><td><strong>{u.name}</strong></td><td>{u.email}</td><td>{u.role}</td><td>{u.active ? "Activo" : "Inactivo"}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h4>Nuevo usuario</h4>
            <EntityForm
              fields={[
                { name: "name", label: "Nombre", required: true },
                { name: "email", label: "Correo", type: "email", required: true },
                { name: "password", label: "Contraseña (mín. 8)", type: "password", required: true },
                { name: "role", label: "Rol", required: true, options: ["ADMIN", "MANAGER", "SALES", "WAREHOUSE", "ACCOUNTING", "HR", "VIEWER"].map((r) => ({ value: r, label: r })) },
              ]}
              submitLabel="Crear usuario"
              error={error}
              onSubmit={createUser}
            />
          </section>

          <section className="panel">
            <h3>🕵️ Auditoría reciente</h3>
            {audit.length === 0 ? <EmptyState text="Sin registros todavía." /> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Entidad</th><th>Detalle</th></tr></thead>
                  <tbody>
                    {audit.slice(0, 25).map((row) => (
                      <tr key={row.id}><td>{formatDate(row.createdAt)}</td><td>{row.user?.name ?? "—"}</td><td>{row.action}</td><td>{row.entity}</td><td>{row.detail ?? ""}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
      <Toast message={toast} />
    </>
  );
}
