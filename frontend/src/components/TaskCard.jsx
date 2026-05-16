const STATUSES = ["todo", "in_progress", "review", "done"];

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  return (
    <div
      className="task-card"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
        e.currentTarget.classList.add("dragging");
      }}
      onDragEnd={(e) => e.currentTarget.classList.remove("dragging")}
    >
      <div className="task-card-header">
        <h4>{task.title}</h4>
        <div className="task-card-actions">
          <button className="btn-icon" onClick={() => onEdit?.(task)} title="Edit">✏️</button>
          {(task._currentUser?.role === "admin" || task.createdBy?.id === task._currentUser?.id) && (
            <button className="btn-icon" onClick={() => onDelete?.(task.id)} title="Delete" style={{ color: "var(--danger)" }}>×</button>
          )}
        </div>
      </div>
      {task.description && <p className="task-card-desc">{task.description}</p>}
      <div className="task-card-meta">
        <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
        {task.dueDate && (
          <span className={`due-date ${new Date(task.dueDate) < new Date() && task.status !== "done" ? "overdue" : ""}`}>
            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
      <div className="task-card-footer">
        <div className="status-dots">
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`status-dot ${s} ${s === task.status ? "active" : ""}`}
              onClick={() => onStatusChange?.(task.id, s)}
              title={s.replace("_", " ")}
            />
          ))}
        </div>
        {task.assignedTo && (
          <div className="task-card-avatar" title={task.assignedTo.name}>
            {task.assignedTo.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
