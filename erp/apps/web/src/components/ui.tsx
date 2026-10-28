import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { statusLabel } from "../lib/format.js";

export function Badge({ value }: { value: string }) {
  const tone =
    ["PAID", "DONE", "FULFILLED", "RECEIVED", "CONFIRMED"].includes(value) ? "ok" :
    ["CANCELLED", "VOID", "URGENT"].includes(value) ? "bad" :
    ["PARTIAL", "IN_PROGRESS", "HIGH"].includes(value) ? "warn" : "neutral";
  return <span className={`badge badge-${tone}`}>{statusLabel(value)}</span>;
}

export function StatCard({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon: string }) {
  return (
    <article className="stat-card">
      <span className="stat-icon" aria-hidden="true">{icon}</span>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {hint ? <p className="stat-hint">{hint}</p> : null}
      </div>
    </article>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EntityForm({ fields, initial, submitLabel, onSubmit, error }: {
  fields: { name: string; label: string; type?: string; required?: boolean; options?: { value: string; label: string }[]; step?: string }[];
  initial?: Record<string, unknown>;
  submitLabel: string;
  onSubmit: (values: Record<string, string>) => Promise<void>;
  error?: string | null;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const start: Record<string, string> = {};
    for (const field of fields) {
      const raw = initial?.[field.name];
      start[field.name] = raw === undefined || raw === null ? "" : String(raw);
    }
    return start;
  });
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try { await onSubmit(values); } finally { setBusy(false); }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <label key={field.name} className="field">
          <span>{field.label}{field.required ? " *" : ""}</span>
          {field.options ? (
            <select value={values[field.name]} onChange={(e) => setValues({ ...values, [field.name]: e.target.value })} required={field.required}>
              <option value="">Selecciona…</option>
              {field.options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          ) : (
            <input
              type={field.type ?? "text"}
              step={field.step}
              value={values[field.name]}
              onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
              required={field.required}
            />
          )}
        </label>
      ))}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Guardando…" : submitLabel}</button>
    </form>
  );
}

export function PageHead({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div className="empty">{text}</div>;
}

export function useToast(): { toast: string | null; show: (msg: string) => void } {
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  return { toast, show: setToast };
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className="toast" role="status">{message}</div>;
}
