import { useState } from "react";
import TaskCard from "./TaskCard";

const STATUSES = ["todo", "in_progress", "review", "done"];
const STATUS_LABELS = {
  todo: "To Do", in_progress: "In Progress", review: "Review", done: "Completed",
};

export default function KanbanBoard({ tasks, onEdit, onDelete, onStatusChange, currentUser }) {
  const [dragOverCol, setDragOverCol] = useState(null);

  const columns = STATUSES.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    tasks: tasks.filter((t) => t.status === status).map((t) => ({ ...t, _currentUser: currentUser })),
  }));

  const handleDragOver = (e, status) => {
    e.preventDefault();
    setDragOverCol(status);
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) onStatusChange?.(taskId, status);
  };

  return (
    <div className="kanban">
      {columns.map((col) => (
        <div
          key={col.status}
          className={`kanban-column ${dragOverCol === col.status ? "drag-over" : ""}`}
          onDragOver={(e) => handleDragOver(e, col.status)}
          onDragLeave={() => setDragOverCol(null)}
          onDrop={(e) => handleDrop(e, col.status)}
        >
          <div className="kanban-header">
            <h3>{col.label}</h3>
            <span className="count">{col.tasks.length}</span>
          </div>
          <div className="kanban-cards">
            {col.tasks.length === 0 && <div className="empty-col">Drop tasks here</div>}
            {col.tasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
