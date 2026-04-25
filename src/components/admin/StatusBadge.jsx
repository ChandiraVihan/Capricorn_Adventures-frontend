import './AdminDashboardShared.css';

const STATUS_CLASS_MAP = {
  Upcoming: 'neutral',
  'In Progress': 'info',
  Completed: 'success',
  Cancelled: 'danger',
  RECEIVED: 'neutral',
  PREPARING: 'warning',
  DELIVERED: 'success',
};

export default function StatusBadge({ status }) {
  const variant = STATUS_CLASS_MAP[status] || 'neutral';
  return <span className={`badge badge-${variant}`}>{status}</span>;
}
