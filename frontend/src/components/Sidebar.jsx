import { useAuth } from "../App";

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { user } = useAuth();
  const location = window.location.pathname;
  const isActive = (path) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <>
      {mobileOpen && <div className="modal-overlay" onClick={onMobileClose} style={{ zIndex: 199 }} />}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">TaskFlow</span>
          <button className="sidebar-toggle" onClick={onToggle}>‹</button>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section-header"><span>Workspace</span></div>
          <a href="/" className={`sidebar-item ${isActive("/") && !isActive("/projects") ? "active" : ""}`}>
            <span className="sidebar-icon">📄</span>
            <span className="sidebar-label">Dashboard</span>
          </a>
          <a href="/projects" className={`sidebar-item ${isActive("/projects") ? "active" : ""}`}>
            <span className="sidebar-icon">📁</span>
            <span className="sidebar-label">Projects</span>
          </a>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-avatar">{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || "User"}</div>
              <div className="sidebar-user-email">{user?.email || "user@email.com"}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
