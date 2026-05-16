import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../App";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="nav-brand">TaskFlow</Link>
        <div className="nav-links">
          <Link to="/" className={location.pathname === "/" ? "active" : ""}>Dashboard</Link>
          <Link to="/projects" className={location.pathname.startsWith("/projects") ? "active" : ""}>Projects</Link>
        </div>
        <div className="nav-user">
          <span className="nav-user-name">{user.name}</span>
          <span className={`role-badge ${user.role}`}>{user.role}</span>
          <button onClick={logout} className="btn btn-ghost btn-sm">Sign out</button>
        </div>
      </div>
    </nav>
  );
}
