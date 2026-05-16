import { useState, useEffect, createContext, useContext } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Sidebar from "./components/Sidebar";
import TopNav from "./components/TopNav";
import { ToastProvider } from "./context/ToastContext";

const API_BASE = "/api";

async function api(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server returned ${res.status} — is the backend running?`);
  }
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export { api, API_BASE };

function AppLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobile, setSidebarMobile] = useState(false);
  const location = useLocation();

  useEffect(() => { setSidebarMobile(false); }, [location]);

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === "/") return [{ label: "Dashboard" }];
    if (path.startsWith("/projects")) {
      if (path === "/projects") return [{ label: "Projects", href: "/projects" }];
      return [{ label: "Projects", href: "/projects" }, { label: "Project" }];
    }
    return [{ label: "Dashboard", href: "/" }];
  };

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={sidebarMobile}
        onMobileClose={() => setSidebarMobile(false)}
      />
      <div className={`main-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <TopNav breadcrumb={getBreadcrumb()} />
        <div>
          <button
            className="btn btn-ghost btn-sm mobile-menu-btn"
            onClick={() => setSidebarMobile(true)}
            style={{ position: "fixed", bottom: 16, left: 16, zIndex: 50, display: "none" }}
          >
            ☰
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api("/auth/me")
        .then((data) => setUser(data.user))
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (user, token) => {
    localStorage.setItem("token", token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  if (loading) return <div className="loading-screen">Loading</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
          <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <ForgotPassword />} />
          <Route path="/" element={user ? <AppLayout><Dashboard /></AppLayout> : <Navigate to="/login" />} />
          <Route path="/projects" element={user ? <AppLayout><Projects /></AppLayout> : <Navigate to="/login" />} />
          <Route path="/projects/:id" element={user ? <AppLayout><ProjectDetail /></AppLayout> : <Navigate to="/login" />} />
        </Routes>
      </ToastProvider>
    </AuthContext.Provider>
  );
}
