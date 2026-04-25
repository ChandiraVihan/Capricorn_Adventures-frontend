import './AdminDashboardShared.css';

const PRIORITY_CLASS_MAP = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'info',
};

export default function PriorityBadge({ priority }) {
  const normalized = String(priority || '').toUpperCase();
  const variant = PRIORITY_CLASS_MAP[normalized] || 'neutral';
  return <span className={`badge badge-${variant}`}>{normalized || 'UNKNOWN'}</span>;
}
