import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, useAuth } from "../App";
import EmptyState from "../components/EmptyState";
import { useToast } from "../context/ToastContext";

export default function Projects() {
  const { user } = useAuth();
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");

  const loadProjects = async () => {
    try {
      const data = await api("/projects");
      setProjects(data);
    } catch {
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const project = await api("/projects", { method: "POST", body: JSON.stringify(form) });
      setProjects([project, ...projects]);
      setForm({ name: "", description: "" });
      setShowForm(false);
      toast.success("Project created");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api(`/projects/${id}`, { method: "DELETE" });
      setProjects(projects.filter((p) => p.id !== id));
      toast.success("Project deleted");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="skeleton skeleton-text" style={{ width: "20%", height: 22, marginBottom: 20 }} />
        <div className="project-grid">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 3 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Projects</h1>
          <div className="page-subtitle">{projects.length} project{projects.length !== 1 ? "s" : ""}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New project"}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <form onSubmit={handleCreate} className="card" style={{ marginBottom: 14, padding: 16 }}>
          <div className="form-row-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Name</label>
              <input type="text" required placeholder="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Description</label>
              <input placeholder="Optional" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>Create</button>
        </form>
      )}

      {projects.length === 0 ? (
        <EmptyState
          icon="📁"
          title="No projects yet"
          message="Create your first project to get started."
          action={<button className="btn btn-primary" onClick={() => setShowForm(true)}>New project</button>}
        />
      ) : (
        <div className="project-grid">
          {projects.map((project) => {
            const isCreator = project.createdBy.id === user.id;
            const memberCount = project.members.length;
            return (
              <div key={project.id} className="project-card">
                <Link to={`/projects/${project.id}`} className="project-card-body">
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <h3>{project.name}</h3>
                    <span className={`project-health ${memberCount > 1 ? "good" : "solo"}`}>
                      {memberCount > 1 ? "Active" : "Solo"}
                    </span>
                  </div>
                  <p>{project.description || "No description"}</p>
                  <div className="project-meta">
                    <span>{memberCount} member{memberCount !== 1 ? "s" : ""}</span>
                    <span>{project.createdBy.name}</span>
                  </div>
                </Link>
                {(isCreator || user.role === "admin") && (
                  <button className="btn-delete" onClick={() => handleDelete(project.id)} title="Delete">×</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
