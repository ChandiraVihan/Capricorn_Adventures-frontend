import "../FinanceDashboard.css";

export default function KpiCard({ label, value, sub, subType = "neutral" }) {
  return (
    <div className="kpi-card">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {sub && <p className={`kpi-sub kpi-sub--${subType}`}>{sub}</p>}
    </div>
  );
}