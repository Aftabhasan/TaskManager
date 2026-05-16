import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api, useAuth } from "../App";
import KanbanBoard from "../components/KanbanBoard";
import EmptyState from "../components/EmptyState";
import { useToast } from "../context/ToastContext";

const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = ["todo", "in_progress", "review", "done"];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", dueDate: "", assignedTo: "" });
  const [memberEmail, setMemberEmail] = useState("");
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState("board");

  const load = async () => {
    try {
      const [proj, tks] = await Promise.all([api(`/projects/${id}`), api(`/tasks?project=${id}`)]);
      setProject(proj);
      setTasks(tks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const canManage = project && (project.createdBy.id === user.id || user.role === "admin");

  const resetForm = () => {
    setForm({ title: "", description: "", priority: "medium", dueDate: "", assignedTo: "" });
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const body = { ...form, project: id, dueDate: form.dueDate || null, assignedTo: form.assignedTo || null };
      if (editing) {
        const updated = await api(`/tasks/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
        setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)));
        toast.success("Task updated");
      } else {
        const created = await api("/tasks", { method: "POST", body: JSON.stringify(body) });
        setTasks([created, ...tasks]);
        toast.success("Task created");
      }
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (task) => {
    setForm({
      title: task.title, description: task.description || "", priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "", assignedTo: task.assignedTo ? task.assignedTo.id : "",
    });
    setEditing(task);
    setShowForm(true);
  };

  const handleDelete = async (taskId) => {
    try {
      await api(`/tasks/${taskId}`, { method: "DELETE" });
      setTasks(tasks.filter((t) => t.id !== taskId));
      toast.success("Task deleted");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleStatus = async (taskId, status) => {
    try {
      const updated = await api(`/tasks/${taskId}`, { method: "PUT", body: JSON.stringify({ status }) });
      setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const proj = await api(`/projects/${id}/members`, { method: "POST", body: JSON.stringify({ email: memberEmail }) });
      setProject(proj);
      setMemberEmail("");
      setShowMemberForm(false);
      toast.success("Member added");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      const proj = await api(`/projects/${id}/members/${userId}`, { method: "DELETE" });
      setProject(proj);
      toast.success("Member removed");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="skeleton skeleton-text" style={{ width: "10%", height: 10, marginBottom: 6 }} />
        <div className="skeleton skeleton-text" style={{ width: "30%", height: 24, marginBottom: 20 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 3 }} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 3 }} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <EmptyState icon="⚠" title="Error" message={error} action={<Link to="/projects" className="btn btn-ghost btn-sm">← Projects</Link>} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page-content">
        <EmptyState icon="🔍" title="Not found" message="This project doesn't exist." action={<Link to="/projects" className="btn btn-ghost btn-sm">← Projects</Link>} />
      </div>
    );
  }

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <Link to="/projects" className="back-link">← Projects</Link>
          <h1>{project.name}</h1>
          {project.description && <div className="page-subtitle">{project.description}</div>}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <div className="stat-card" style={{ padding: "10px 14px", flex: 1 }}>
          <div className="stat-value" style={{ fontSize: "1rem" }}>{total}</div>
          <div className="stat-label">Tasks</div>
        </div>
        <div className="stat-card" style={{ padding: "10px 14px", flex: 1 }}>
          <div className="stat-value" style={{ fontSize: "1rem", color: "var(--green)" }}>{done}</div>
          <div className="stat-label">Done</div>
        </div>
        <div className="stat-card" style={{ padding: "10px 14px", flex: 1 }}>
          <div className="stat-value" style={{ fontSize: "1rem" }}>{project.members.length}</div>
          <div className="stat-label">Members</div>
        </div>
        <div className="stat-card" style={{ padding: "10px 14px", flex: 1 }}>
          <div className="stat-value" style={{ fontSize: "1rem" }}>{pct}%</div>
          <div className="stat-label">Progress</div>
          <div className="progress-track" style={{ marginTop: 4 }}>
            <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: "var(--green)" }} />
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Team ({project.members.length})</h2>
          {canManage && (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowMemberForm(!showMemberForm)}>
              {showMemberForm ? "Cancel" : "Add"}
            </button>
          )}
        </div>
        {showMemberForm && (
          <form onSubmit={handleAddMember} style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <input type="email" placeholder="Enter email" required value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              style={{ flex: 1, padding: "5px 8px", border: "1px solid var(--border)", borderRadius: 3, fontSize: ".75rem", outline: "none", background: "var(--bg)" }} />
            <button type="submit" className="btn btn-primary btn-sm">Add</button>
          </form>
        )}
        <div className="member-list">
          {project.members.map((m) => (
            <div key={m.id} className="member-chip">
              <div className="member-avatar-sm">{m.name.charAt(0)}</div>
              <span>{m.name}</span>
              {m.id === project.createdBy.id && <span className="role-badge admin">Owner</span>}
              {canManage && m.id !== project.createdBy.id && (
                <button className="btn-remove" onClick={() => handleRemoveMember(m.id)}>×</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <hr className="notion-divider" />

      <div className="section">
        <div className="section-header">
          <h2>Tasks ({total})</h2>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 1, background: "var(--bg-sidebar)", borderRadius: 3, padding: 2, border: "1px solid var(--border)" }}>
              <button className={`btn btn-xs ${view === "board" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("board")}>Board</button>
              <button className={`btn btn-xs ${view === "table" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("table")}>Table</button>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setForm({ title: "", description: "", priority: "medium", dueDate: "", assignedTo: "" }); setShowForm(!showForm); }}>
              {showForm ? "Cancel" : "New"}
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 12, padding: 14 }}>
            <div className="form-group">
              <label>Title</label>
              <input type="text" required placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Optional" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-row-2" style={{ gap: 6 }}>
                  <div className="form-group">
                    <label>Due</label>
                    <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Assignee</label>
                    <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                      <option value="">Unassigned</option>
                      {project.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">{editing ? "Update" : "Create"}</button>
          </form>
        )}

        {total === 0 ? (
          <EmptyState
            icon="📝"
            title="No tasks"
            message="Create your first task."
            action={<button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setForm({ title: "", description: "", priority: "medium", dueDate: "", assignedTo: "" }); setShowForm(true); }}>New task</button>}
          />
        ) : view === "board" ? (
          <KanbanBoard tasks={tasks} currentUser={user} onEdit={handleEdit} onDelete={handleDelete} onStatusChange={handleStatus} />
        ) : (
          <div className="task-table">
            <div className="task-table-header">
              <span></span>
              <span>Title</span>
              <span>Priority</span>
              <span>Assignee</span>
              <span>Due</span>
            </div>
            {STATUSES.map((status) => {
              const filtered = tasks.filter((t) => t.status === status);
              if (filtered.length === 0) return null;
              return (
                <div key={status}>
                  <div className="status-group-label">{status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</div>
                  {filtered.map((task) => (
                    <div key={task.id} className="task-row" onClick={() => handleEdit(task)} style={{ gridTemplateColumns: "auto 1fr auto auto auto" }}>
                      <input type="checkbox" checked={task.status === "done"} onChange={() => handleStatus(task.id, task.status === "done" ? "todo" : "done")} />
                      <span style={{ fontSize: ".8125rem", fontWeight: 500, color: task.status === "done" ? "var(--text-tertiary)" : "var(--text)" }}>
                        {task.title}
                      </span>
                      <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
                      <span style={{ fontSize: ".6875rem", color: "var(--text-tertiary)" }}>{task.assignedTo?.name || "—"}</span>
                      <span className={`due-date ${task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done" ? "overdue" : ""}`}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
