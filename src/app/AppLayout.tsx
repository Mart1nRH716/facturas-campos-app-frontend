import { NavLink, Outlet } from "react-router-dom";
import {
  Building2,
  FileUp,
  LayoutDashboard,
  LogOut,
  Menu,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../features/auth/useAuth";

const navigation = [
  { to: "/", label: "Resumen", icon: LayoutDashboard, end: true },
  { to: "/entidades", label: "Entidades", icon: Building2 },
  { to: "/proveedores", label: "Proveedores", icon: Truck },
  { to: "/procesar", label: "Procesar ZIP", icon: FileUp },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">F</span>
          <span>
            Facturas<span className="brand-muted">App</span>
          </span>
        </div>
        <div className="sidebar-heading">Workspace</div>
        <nav className="main-nav">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="avatar">
              {user?.username.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <strong>{user?.username}</strong>
              <span>Cuenta activa</span>
            </div>
          </div>
          <button
            className="logout-button"
            onClick={logout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      {open && (
        <button
          className="sidebar-backdrop"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        />
      )}
      <main className="main-content">
        <button
          className="mobile-menu"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu size={21} />
        </button>
        <Outlet />
      </main>
    </div>
  );
}
