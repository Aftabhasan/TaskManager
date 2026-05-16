export default function ProgressRing({ progress = 0, size = 48, stroke = 3, color }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;
  return (
    <svg className="progress-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle className="progress-ring-bg" cx={size / 2} cy={size / 2} r={r} />
      <circle
        className="progress-ring-fill"
        cx={size / 2} cy={size / 2} r={r}
        strokeDasharray={c}
        strokeDashoffset={offset}
        stroke={color || "var(--primary)"}
      />
    </svg>
  );
}
