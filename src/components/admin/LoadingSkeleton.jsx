import './AdminDashboardShared.css';

export default function LoadingSkeleton({ rows = 5 }) {
  return (
    <div className="skeleton-wrapper" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="skeleton-row" />
      ))}
    </div>
  );
}
