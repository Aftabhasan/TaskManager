import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, useAuth } from "../App";
import StatCard from "../components/StatCard";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/dashboard").then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-content">
        <div className="skeleton skeleton-text" style={{ width: "30%", height: 24, marginBottom: 4 }} />
        <div className="skeleton skeleton-text short" style={{ marginBottom: 24 }} />
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 70, borderRadius: 3 }} />)}
        </div>
        <div className="skeleton" style={{ height: 120, borderRadius: 3 }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3>Unable to load</h3>
          <p>Please try again.</p>
        </div>
      </div>
    );
  }

  const total = data.statusData.reduce((s, d) => s + d.value, 0);
  const doneTasks = data.statusData.find((s) => s.name === "Done")?.value || 0;
  const completionPct = total > 0 ? Math.round((doneTasks / total) * 100) : 0;

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>{getGreeting()}, {user.name.split(" ")[0]}</h1>
          <div className="page-subtitle">{data.projectCount} project{data.projectCount !== 1 ? "s" : ""} · {data.totalTasks} task{data.totalTasks !== 1 ? "s" : ""}</div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Tasks" value={data.totalTasks} icon="📋" />
        <StatCard label="Completed" value={doneTasks} icon="✓" />
        <StatCard label="Overdue" value={data.overdueTasks} icon="⚠" />
        <StatCard label="Active Projects" value={data.projectCount} icon="📁" />
      </div>

      <div className="grid-sidebar">
        <div className="section" style={{ marginBottom: 0 }}>
          <div className="section-header"><h2>Task Status</h2></div>
          <div className="card" style={{ padding: 16 }}>
            {data.statusData.map((s) => {
              const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
              return (
                <div key={s.name} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".75rem", marginBottom: 3 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{s.name}</span>
                    <span style={{ color: "var(--text-tertiary)" }}>{s.value}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="section" style={{ marginBottom: 0 }}>
            <div className="section-header"><h2>Progress</h2></div>
            <div className="card" style={{ padding: 20, textAlign: "center" }}>
              <div style={{ position: "relative", width: 80, margin: "0 auto 8px" }}>
                <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="40" cy="40" r="34" fill="none" stroke="var(--bg-sidebar)" strokeWidth="5" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke="var(--green)" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={`${(completionPct / 100) * 213.6} 213.6`}
                    style={{ transition: "stroke-dasharray .5s ease" }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.125rem", fontWeight: 600, color: "var(--text)" }}>
                  {completionPct}%
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".6875rem", color: "var(--text-tertiary)", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                <span>{total - doneTasks} left</span>
                <span>{doneTasks} done</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {data.myTasks.length > 0 && (
        <div className="section" style={{ marginTop: 20 }}>
          <div className="section-header"><h2>My Active Tasks</h2></div>
          <div>
            {data.myTasks.map((task) => (
              <Link to={`/projects/${task.project.id}`} key={task.id} className="task-row" style={{ gridTemplateColumns: "auto 1fr auto" }}>
                <span className={`status-badge ${task.status}`} style={{ fontSize: ".5625rem" }}>{task.status.replace("_", " ")}</span>
                <span style={{ fontSize: ".8125rem", fontWeight: 500, color: "var(--text)" }}>{task.title}</span>
                <span style={{ fontSize: ".6875rem", color: "var(--text-tertiary)" }}>{task.project.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
