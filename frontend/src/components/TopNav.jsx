import { useAuth } from "../App";

export default function TopNav({ breadcrumb }) {
  const { user, logout } = useAuth();

  return (
    <header className="topnav">
      <div className="topnav-breadcrumb">
        {breadcrumb?.map((item, i) => (
          <span key={i}>
            {i > 0 && <span className="sep">/</span>}
            {item.href ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>}
          </span>
        ))}
      </div>
      <div className="topnav-actions">
        <button className="topnav-btn">🔔</button>
        <div className="topnav-profile" onClick={logout} title="Sign out">
          <div className="sidebar-avatar">{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
        </div>
      </div>
    </header>
  );
}
