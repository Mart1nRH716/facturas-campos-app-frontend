import { useState, type FormEvent, type ReactNode } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowRight,
  Building2,
  FileUp,
  LockKeyhole,
  Truck,
} from "lucide-react";
import { AppLayout } from "./app/AppLayout";
import { RequireAuth } from "./app/RequireAuth";
import { AuthProvider } from "./features/auth/AuthContext";
import { useAuth } from "./features/auth/useAuth";
import { CatalogPage } from "./features/catalog";
import { ProcessPage } from "./features/procesamiento/ProcessPage";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/entidades" element={<CatalogPage kind="entidades" />} />
          <Route
            path="/proveedores"
            element={<CatalogPage kind="proveedores" />}
          />
          <Route path="/procesar" element={<ProcessPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  if (!loading && user) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await login(username, password);
      navigate((location.state as { from?: string } | null)?.from ?? "/");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No fue posible iniciar sesión",
      );
    }
  }

  return (
    <div className="login-page">
      <div className="login-decoration">
        <div className="login-brand">
          <span className="brand-mark">F</span>
          <span>
            Facturas<span className="brand-muted">App</span>
          </span>
        </div>
        <div className="login-quote">
          <span className="eyebrow">GESTIÓN FISCAL, SIN FRICCIÓN</span>
          <h1>Tu operación financiera, en orden.</h1>
          <p>
            Centraliza catálogos y procesa tus facturas con una vista clara de
            cada lote.
          </p>
        </div>
        <div className="login-orbit orbit-one" />
        <div className="login-orbit orbit-two" />
      </div>
      <main className="login-panel">
        <div className="login-card">
          <div className="mobile-login-brand">
            <span className="brand-mark">F</span>
            <span>
              Facturas<span className="brand-muted">App</span>
            </span>
          </div>
          <span className="eyebrow">BIENVENIDO DE VUELTA</span>
          <h2>Inicia sesión</h2>
          <p className="muted">Accede a tu espacio de trabajo.</p>
          {error && <div className="alert error">{error}</div>}
          <form onSubmit={handleSubmit} className="form-stack">
            <label>
              Usuario
              <input
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                placeholder="tu usuario"
              />
            </label>
            <label>
              Contraseña
              <div className="input-with-icon">
                <LockKeyhole size={17} />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>
            </label>
            <button className="button primary full" type="submit">
              Entrar <ArrowRight size={17} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">ESPACIO DE TRABAJO</span>
          <h1>Hola, {user?.username}</h1>
          <p className="muted">
            Gestiona tus catálogos y prepara tu próximo lote.
          </p>
        </div>
      </header>
      <section className="welcome-panel">
        <div>
          <span className="eyebrow light">FLUJO RECOMENDADO</span>
          <h2>De tus XML a un reporte listo.</h2>
          <p>
            Completa los catálogos para que el procesamiento encuentre cada
            entidad y proveedor de tus facturas.
          </p>
          <Link className="button light-button" to="/procesar">
            Procesar un ZIP <ArrowRight size={17} />
          </Link>
        </div>
        <div className="welcome-lines" />
      </section>
      <div className="quick-grid">
        <QuickCard
          to="/entidades"
          icon={<Building2 />}
          title="Entidades"
          description="Administra las entidades receptoras."
        />
        <QuickCard
          to="/proveedores"
          icon={<Truck />}
          title="Proveedores"
          description="Mantén tu catálogo de emisores."
        />
        <QuickCard
          to="/procesar"
          icon={<FileUp />}
          title="Procesar ZIP"
          description="Genera un XLSX desde tus XML."
        />
      </div>
    </div>
  );
}

function QuickCard({
  to,
  icon,
  title,
  description,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link to={to} className="quick-card">
      <span className="quick-icon">{icon}</span>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <ArrowRight size={17} className="quick-arrow" />
    </Link>
  );
}

export default App;
