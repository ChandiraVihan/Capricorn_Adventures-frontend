import './AdminDashboardShared.css';

export default function MetricCard({ title, value, subtitle, accent = 'default' }) {
  return (
    <article className={`metric-card metric-card-${accent}`}>
      <p className="metric-card-title">{title}</p>
      <p className="metric-card-value">{value}</p>
      {subtitle ? <p className="metric-card-subtitle">{subtitle}</p> : null}
    </article>
  );
}
