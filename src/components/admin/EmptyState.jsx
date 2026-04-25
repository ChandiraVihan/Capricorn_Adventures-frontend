import './AdminDashboardShared.css';

export default function EmptyState({ title, description, action }) {
  return (
    <section className="panel empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {action || null}
    </section>
  );
}
