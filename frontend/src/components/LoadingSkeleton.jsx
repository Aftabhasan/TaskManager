export default function LoadingSkeleton({ type = "card", count = 1 }) {
  if (type === "card") {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton skeleton-card" style={{ marginBottom: 8 }} />
        ))}
      </>
    );
  }
  if (type === "text") {
    return (
      <div style={{ padding: "4px 0" }}>
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text short" />
      </div>
    );
  }
  if (type === "kanban") {
    return (
      <div className="kanban">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="kanban-column">
            <div className="skeleton skeleton-text" style={{ width: "60%", height: 16, marginBottom: 12 }} />
            <div className="skeleton skeleton-card" style={{ height: 80, marginBottom: 6 }} />
            <div className="skeleton skeleton-card" style={{ height: 100, marginBottom: 6 }} />
            <div className="skeleton skeleton-card" style={{ height: 70 }} />
          </div>
        ))}
      </div>
    );
  }
  return null;
}
