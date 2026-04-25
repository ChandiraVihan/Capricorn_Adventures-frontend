import './AdminDashboardShared.css';

export default function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <section className="panel error-state" role="alert">
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry ? (
        <button className="action-btn" onClick={onRetry} type="button">
          Try Again
        </button>
      ) : null}
    </section>
  );
}
