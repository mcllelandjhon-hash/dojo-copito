import { useCallback, useEffect, useState } from "react";
import { Badge, EmptyState, EntityForm, Modal, PageHead, Toast, useToast } from "../components/ui.js";
import { api } from "../lib/api.js";
import { formatDate } from "../lib/format.js";

interface Task { id: string; title: string; description?: string | null; status: string; priority: string; dueAt?: string | null }

const NEXT_STATUS: Record<string, string> = { TODO: "IN_PROGRESS", IN_PROGRESS: "DONE", DONE: "TODO" };

export function TasksPage() {
  const [items, setItems] = useState<Task[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast, show } = useToast();

  const load = useCallback(() => {
    api.list<Task>("/api/v1/tasks?pageSize=100").then((r) => setItems(r.items)).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function save(values: Record<string, string>) {
    setError(null);
    try {
      await api.post("/api/v1/tasks", { title: values.title, description: values.description || null, priority: values.priority, status: "TODO", dueAt: values.dueAt ? new Date(values.dueAt).toISOString() : null });
      setCreating(false); show("Tarea creada"); load();
    } catch (e) { setError(e instanceof Error ? e.message : "Error al guardar"); }
  }

  async function advance(task: Task) {
    try {
      await api.patch(`/api/v1/tasks/${task.id}`, { status: NEXT_STATUS[task.status] });
      load();
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo actualizar"); }
  }

  const columns: { key: string; label: string }[] = [
    { key: "TODO", label: "Por hacer" },
    { key: "IN_PROGRESS", label: "En curso" },
    { key: "DONE", label: "Hechas" },
  ];

  return (
    <>
      <PageHead title="Tareas internas" subtitle="Pendientes del equipo. Toca una tarea para avanzar su estado." action={<button className="btn btn-primary" onClick={() => setCreating(true)}>+ Nueva tarea</button>} />
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="kanban">
        {columns.map((col) => (
          <section className="kanban-col" key={col.key}>
            <h3>{col.label}</h3>
            {items.filter((t) => t.status === col.key).length === 0 ? <EmptyState text="Nada por aquí." /> : null}
            {items.filter((t) => t.status === col.key).map((task) => (
              <button key={task.id} className="task-card" onClick={() => advance(task)}>
                <strong>{task.title}</strong>
                {task.description ? <span>{task.description}</span> : null}
                <span className="task-meta"><Badge value={task.priority} />{task.dueAt ? <span>Vence {formatDate(task.dueAt)}</span> : null}</span>
              </button>
            ))}
          </section>
        ))}
      </div>
      {creating ? (
        <Modal title="Nueva tarea" onClose={() => setCreating(false)}>
          <EntityForm
            fields={[
              { name: "title", label: "Título", required: true },
              { name: "description", label: "Descripción" },
              { name: "priority", label: "Prioridad", required: true, options: [{ value: "LOW", label: "Baja" }, { value: "MEDIUM", label: "Media" }, { value: "HIGH", label: "Alta" }, { value: "URGENT", label: "Urgente" }] },
              { name: "dueAt", label: "Vencimiento", type: "date" },
            ]}
            submitLabel="Crear tarea"
            error={error}
            onSubmit={save}
          />
        </Modal>
      ) : null}
      <Toast message={toast} />
    </>
  );
}
