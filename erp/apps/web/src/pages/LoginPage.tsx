import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, getToken, saveSession } from "../lib/api.js";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@copito.local");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (getToken()) navigate("/");
  }, [navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await api.login(email, password);
      saveSession(session.token, session.user);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <p className="login-logo">🧩</p>
        <h1>ERP Copito</h1>
        <p className="login-sub">Ventas, inventario, finanzas y más, en un solo lugar.</p>
        <label className="field">
          <span>Correo</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>{busy ? "Ingresando…" : "Ingresar"}</button>
        <p className="login-demo">Demo local: admin@copito.local · Admin123!</p>
      </form>
    </div>
  );
}
