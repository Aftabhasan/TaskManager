export default function EmptyState({ icon = "📋", title, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      {title && <h3>{title}</h3>}
      {message && <p>{message}</p>}
      {action && action}
    </div>
  );
}
