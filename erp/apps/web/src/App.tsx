import { useState, type ReactNode } from "react";
import { Link, Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { clearSession, getToken, getUser } from "./lib/api.js";
import { CustomersPage, SuppliersPage } from "./pages/CatalogPages.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { EmployeesPage } from "./pages/EmployeesPage.js";
import { FinancePage } from "./pages/FinancePage.js";
import { InvoicesPage } from "./pages/InvoicesPage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { ProductsPage } from "./pages/ProductsPage.js";
import { PurchasesPage } from "./pages/PurchasesPage.js";
import { ReportsPage } from "./pages/ReportsPage.js";
import { SalesPage } from "./pages/SalesPage.js";
import { SettingsPage } from "./pages/SettingsPage.js";
import { TasksPage } from "./pages/TasksPage.js";

const NAV = [
  { to: "/", label: "Panel", icon: "📊" },
  { to: "/ventas", label: "Ventas", icon: "🧾" },
  { to: "/compras", label: "Compras", icon: "🛒" },
  { to: "/productos", label: "Productos e inventario", icon: "📦" },
  { to: "/clientes", label: "Clientes", icon: "👥" },
  { to: "/proveedores", label: "Proveedores", icon: "🏭" },
  { to: "/facturas", label: "Facturas y pagos", icon: "💳" },
  { to: "/finanzas", label: "Finanzas", icon: "💰" },
  { to: "/empleados", label: "Recursos humanos", icon: "🧑‍🤝‍🧑" },
  { to: "/tareas", label: "Tareas", icon: "✅" },
  { to: "/reportes", label: "Reportes", icon: "📈" },
  { to: "/ajustes", label: "Ajustes", icon: "⚙️" },
];

function Shell({ children }: { children: ReactNode }) {
  const user = getUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <div className="shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Link className="logo" to="/" onClick={() => setOpen(false)}>🧩 ERP <strong>Copito</strong></Link>
        <nav>
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <span aria-hidden="true">{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <p className="user-name">{user?.name}</p>
          <p className="user-role">{user?.role} · {user?.email}</p>
          <button className="btn btn-ghost btn-small" onClick={() => { clearSession(); navigate("/login"); }}>Cerrar sesión</button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" aria-label="Abrir menú" onClick={() => setOpen(!open)}>☰</button>
          <span className="topbar-title">Gestión empresarial</span>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

function Protected({ children }: { children: ReactNode }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return <Shell>{children}</Shell>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/ventas" element={<Protected><SalesPage /></Protected>} />
      <Route path="/compras" element={<Protected><PurchasesPage /></Protected>} />
      <Route path="/productos" element={<Protected><ProductsPage /></Protected>} />
      <Route path="/clientes" element={<Protected><CustomersPage /></Protected>} />
      <Route path="/proveedores" element={<Protected><SuppliersPage /></Protected>} />
      <Route path="/facturas" element={<Protected><InvoicesPage /></Protected>} />
      <Route path="/finanzas" element={<Protected><FinancePage /></Protected>} />
      <Route path="/empleados" element={<Protected><EmployeesPage /></Protected>} />
      <Route path="/tareas" element={<Protected><TasksPage /></Protected>} />
      <Route path="/reportes" element={<Protected><ReportsPage /></Protected>} />
      <Route path="/ajustes" element={<Protected><SettingsPage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
