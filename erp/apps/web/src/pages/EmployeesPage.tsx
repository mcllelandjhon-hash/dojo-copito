import { useCallback, useEffect, useState } from "react";
import { EmptyState, EntityForm, Modal, PageHead, Toast, useToast } from "../components/ui.js";
import { api } from "../lib/api.js";
import { formatMoney, toCents } from "../lib/format.js";

interface Employee {
  id: string; firstName: string; lastName: string; email?: string | null; phone?: string | null;
  position: string; salaryCents: number; active: boolean; department?: { id: string; name: string } | null;
}
interface Department { id: string; name: string }

export function EmployeesPage() {
  const [items, setItems] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [creating, setCreating] = useState(false);
  const [newDept, setNewDept] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { toast, show } = useToast();

  const load = useCallback(() => {
    api.list<Employee>("/api/v1/employees?pageSize=100").then((r) => setItems(r.items)).catch((e: Error) => setError(e.message));
    api.list<Department>("/api/v1/departments?pageSize=100").then((r) => setDepartments(r.items)).catch(() => undefined);
  }, []);
  useEffect(load, [load]);

  async function save(values: Record<string, string>) {
    setError(null);
    try {
      await api.post("/api/v1/employees", {
        firstName: values.firstName, lastName: values.lastName, email: values.email || null,
        phone: values.phone || null, position: values.position,
        departmentId: values.departmentId || null, salaryCents: toCents(values.salary || "0"),
      });
      setCreating(false); show("Empleado creado"); load();
    } catch (e) { setError(e instanceof Error ? e.message : "Error al guardar"); }
  }

  async function createDepartment() {
    if (!newDept.trim()) return;
    try {
      await api.post("/api/v1/departments", { name: newDept.trim() });
      setNewDept(""); show("Departamento creado"); load();
    } catch (e) { setError(e instanceof Error ? e.message : "Error al crear departamento"); }
  }

  return (
    <>
      <PageHead title="Recursos humanos" subtitle="Empleados, cargos y departamentos de la empresa." action={<button className="btn btn-primary" onClick={() => setCreating(true)}>+ Nuevo empleado</button>} />
      <section className="panel">
        <h3>Departamentos</h3>
        <div className="chips">
          {departments.map((d) => <span className="chip" key={d.id}>{d.name}</span>)}
          <span className="chip chip-form">
            <input placeholder="Nuevo departamento…" value={newDept} onChange={(e) => setNewDept(e.target.value)} aria-label="Nuevo departamento" />
            <button className="btn btn-ghost btn-small" onClick={createDepartment}>Crear</button>
          </span>
        </div>
      </section>
      {items.length === 0 ? <EmptyState text="Sin empleados registrados." /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Empleado</th><th>Cargo</th><th>Departamento</th><th>Correo</th><th>Sueldo</th><th>Estado</th></tr></thead>
            <tbody>
              {items.map((emp) => (
                <tr key={emp.id}>
                  <td><strong>{emp.firstName} {emp.lastName}</strong></td>
                  <td>{emp.position}</td>
                  <td>{emp.department?.name ?? "—"}</td>
                  <td>{emp.email ?? "—"}</td>
                  <td>{formatMoney(emp.salaryCents)}</td>
                  <td>{emp.active ? "Activo" : "Inactivo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {creating ? (
        <Modal title="Nuevo empleado" onClose={() => setCreating(false)}>
          <EntityForm
            fields={[
              { name: "firstName", label: "Nombres", required: true },
              { name: "lastName", label: "Apellidos", required: true },
              { name: "position", label: "Cargo", required: true },
              { name: "departmentId", label: "Departamento", options: departments.map((d) => ({ value: d.id, label: d.name })) },
              { name: "email", label: "Correo", type: "email" },
              { name: "phone", label: "Teléfono" },
              { name: "salary", label: "Sueldo mensual (S/)", type: "number", step: "0.01" },
            ]}
            submitLabel="Crear empleado"
            error={error}
            onSubmit={save}
          />
        </Modal>
      ) : null}
      <Toast message={toast} />
    </>
  );
}
