import { useEffect, useMemo, useState } from 'react';
import { getShiftOverview } from '../../api/adminDashboardService';
import { useAuth } from '../../context/AuthContext';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingSkeleton from './LoadingSkeleton';

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

export default function ShiftOverviewWidget() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const refresh = async () => {
    try {
      setError(null);
      const response = await getShiftOverview();
      const payload = response?.data ?? response?.payload ?? response ?? null;
      setData(payload);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer = null;

    const run = async () => {
      await refresh();
    };

    run();

    if (data?.autoRefreshEnabled && data?.refreshIntervalSeconds) {
      timer = window.setInterval(run, data.refreshIntervalSeconds * 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [data?.autoRefreshEnabled, data?.refreshIntervalSeconds]);

  const ownerAccessWarning = useMemo(() => {
    if (String(user?.role).toUpperCase() !== 'OWNER') return null;
    if (error?.status !== 401) return null;
    return 'Owner shift overview is temporarily blocked by backend route policy (401). Please retry once backend access is updated.';
  }, [user?.role, error?.status]);

  if (loading) {
    return (
      <section className="panel">
        <h2 className="panel-title">Shift Overview</h2>
        <LoadingSkeleton rows={4} />
      </section>
    );
  }

  if (ownerAccessWarning) {
    return (
      <section className="panel">
        <h2 className="panel-title">Shift Overview</h2>
        <div className="warning-note">{ownerAccessWarning}</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel">
        <h2 className="panel-title">Shift Overview</h2>
        <ErrorState
          message={error.message || 'Unable to load shift overview.'}
          onRetry={refresh}
        />
      </section>
    );
  }

  if (!data?.departments?.length) {
    return (
      <section className="panel">
        <h2 className="panel-title">Shift Overview</h2>
        <EmptyState
          title="No active shifts"
          description="No staff shifts are currently available for this business date."
        />
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="page-header">
        <div>
          <h2 className="panel-title">Shift Overview</h2>
          <p>Generated: {formatDateTime(data.generatedAt)}</p>
        </div>
      </div>

      <div className="list">
        {data.departments.map((department) => (
          <article
            key={department.departmentCode}
            className={`card ${department.understaffed ? 'card-alert' : ''}`}
          >
            <div className="page-header">
              <div>
                <h3>{department.departmentName}</h3>
                {department.warning ? <p className="warning-note">{department.warning}</p> : null}
              </div>
            </div>

            <div className="list">
              {(department.onShiftStaff || department.on_shift_staff || []).map((staff, idx) => {
                const name = staff?.staffName ?? staff?.staff_name ?? staff?.name ?? 'Unknown staff';
                const shiftStartAt = staff?.shiftStartAt ?? staff?.shift_start_at ?? staff?.shiftStart ?? null;
                const currentTaskAssignment =
                  staff?.currentTaskAssignment ?? staff?.current_task_assignment ?? staff?.task ?? null;
                const lastActivityAt = staff?.lastActivityAt ?? staff?.last_activity_at ?? null;
                const shiftId =
                  staff?.shiftId ?? staff?.shift_id ?? `${department.departmentCode || 'dept'}-${idx}`;

                return (
                  <button
                    key={shiftId}
                    type="button"
                    className="card"
                    style={{ color: '#0f1f2f' }}
                    onClick={() =>
                      setSelectedStaff({
                        staffName: name,
                        currentTaskAssignment,
                        lastActivityAt,
                      })
                    }
                  >
                    <strong>{name}</strong>
                    <p>Shift start: {formatDateTime(shiftStartAt)}</p>
                  </button>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      {selectedStaff ? (
        <div className="panel" style={{ marginTop: 12 }}>
          <div className="page-header">
            <h3>Staff Detail</h3>
            <button className="secondary-btn action-btn" onClick={() => setSelectedStaff(null)} type="button">
              Close
            </button>
          </div>
          <div className="kv">
            <div className="kv-item">
              <p className="kv-label">Name</p>
              <p className="kv-value">{selectedStaff.staffName}</p>
            </div>
            <div className="kv-item">
              <p className="kv-label">Current Task</p>
              <p className="kv-value">{selectedStaff.currentTaskAssignment || 'Not assigned'}</p>
            </div>
            <div className="kv-item">
              <p className="kv-label">Last Activity</p>
              <p className="kv-value">{formatDateTime(selectedStaff.lastActivityAt)}</p>
            </div>
          </div>
        </div>
      ) : null}

      {data.ownerMetrics ? (
        <div className="panel" style={{ marginTop: 12 }}>
          <h3>Owner Metrics</h3>
          <div className="kv">
            <div className="kv-item">
              <p className="kv-label">Business Date</p>
              <p className="kv-value">{data.ownerMetrics.businessDate}</p>
            </div>
            <div className="kv-item">
              <p className="kv-label">Total Labor Hours</p>
              <p className="kv-value">{data.ownerMetrics.totalLaborHours}</p>
            </div>
            <div className="kv-item">
              <p className="kv-label">Estimated Shift Cost</p>
              <p className="kv-value">{data.ownerMetrics.estimatedShiftCost.toLocaleString()}</p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
