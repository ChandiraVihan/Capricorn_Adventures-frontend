import { useEffect, useState } from 'react';
import EmptyState from './components/admin/EmptyState';
import ErrorState from './components/admin/ErrorState';
import LoadingSkeleton from './components/admin/LoadingSkeleton';
import StatusBadge from './components/admin/StatusBadge';
import { useAuth } from './context/AuthContext';
import { getRoomServiceErrorMessage, isRoomServicePermissionError } from './state/roomServiceState';
import { useRoomServiceOperations } from './hooks/useRoomServiceOperations';
import './components/admin/AdminDashboardShared.css';

const STATUS_LABELS = {
  RECEIVED: 'Received',
  PREPARING: 'Preparing',
  DELIVERED: 'Delivered',
};

const INITIAL_CREATE_FORM = {
  roomNumber: '',
  floorNumber: '',
  itemsRaw: '',
};

// Temporary bypass to keep Room Service dashboard actions accessible during integration testing.
const ROOM_SERVICE_AUTH_BYPASS = true;

function toTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function isUuid(input) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input);
}

function parseItems(raw) {
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function formatTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function buildFilterPayload(filters) {
  return {
    floor: filters.floor === '' ? '' : Number(filters.floor),
    minRoom: filters.minRoom === '' ? '' : Number(filters.minRoom),
    maxRoom: filters.maxRoom === '' ? '' : Number(filters.maxRoom),
  };
}

function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="room-service-toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <article key={toast.id} className={`room-service-toast room-service-toast-${toast.type}`}>
          <div>
            <strong>{toast.title}</strong>
            {toast.message ? <p>{toast.message}</p> : null}
          </div>
          <button type="button" className="room-service-toast-dismiss" onClick={() => onDismiss(toast.id)}>
            Dismiss
          </button>
        </article>
      ))}
    </div>
  );
}

function ConnectionPill({ status }) {
  const labelMap = {
    connected: 'Connected',
    reconnecting: 'Reconnecting',
    connecting: 'Connecting',
    offline: 'Offline',
  };

  return <span className={`room-service-connection room-service-connection-${status}`}>{labelMap[status] || 'Offline'}</span>;
}

export default function RoomServiceDashboard() {
  const { hasAnyRole, user } = useAuth();
  const {
    filters,
    setFilters,
    applyFilters,
    filterError,
    clearFilterError,
    summaryDate,
    setSummaryDate,
    dashboard,
    dailySummary,
    dashboardLoading,
    dailySummaryLoading,
    dashboardError,
    dailySummaryError,
    connectionStatus,
    toasts,
    dismissToast,
    alertBanner,
    clearAlert,
    createOrder,
    assignStaff,
    updateStatus,
    operationState,
    refreshDashboard,
    refreshDailySummary,
    getAllowedStatuses,
  } = useRoomServiceOperations();

  const [createForm, setCreateForm] = useState(INITIAL_CREATE_FORM);
  const [createFormError, setCreateFormError] = useState('');
  const [createFormSuccess, setCreateFormSuccess] = useState('');
  const [assignInputs, setAssignInputs] = useState({});
  const [actionError, setActionError] = useState('');

  const canAssign = ROOM_SERVICE_AUTH_BYPASS || hasAnyRole('ADMIN', 'MANAGER');
  const canManageDashboard = ROOM_SERVICE_AUTH_BYPASS || hasAnyRole('ADMIN', 'MANAGER');
  const canCreate = ROOM_SERVICE_AUTH_BYPASS || hasAnyRole('ADMIN', 'MANAGER');
  const canUpdateStatus = ROOM_SERVICE_AUTH_BYPASS || hasAnyRole('ADMIN', 'MANAGER', 'STAFF');

  const orders = dashboard?.activeOrders || [];
  const unresolvedOrders = dailySummary?.unresolvedOrders || [];

  useEffect(() => {
    if (!createFormSuccess) return undefined;
    const timer = window.setTimeout(() => setCreateFormSuccess(''), 4500);
    return () => clearTimeout(timer);
  }, [createFormSuccess]);

  useEffect(() => {
    if (!actionError) return undefined;
    const timer = window.setTimeout(() => setActionError(''), 5000);
    return () => clearTimeout(timer);
  }, [actionError]);

  useEffect(() => {
    if (!toasts.length) return undefined;
    const timer = window.setTimeout(() => {
      dismissToast(toasts[0].id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [dismissToast, toasts]);

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setCreateFormError('');
    setCreateFormSuccess('');

    const roomNumber = Number(createForm.roomNumber);
    const floorNumber = Number(createForm.floorNumber);
    const itemsOrdered = parseItems(createForm.itemsRaw);

    if (!roomNumber || !floorNumber || !itemsOrdered.length) {
      setCreateFormError('Provide a valid room number, floor number, and at least one item.');
      return;
    }

    try {
      await createOrder({ roomNumber, floorNumber, itemsOrdered });
      setCreateForm(INITIAL_CREATE_FORM);
      setCreateFormSuccess('Room service order created. The dashboard was refreshed.');
    } catch (error) {
      setCreateFormError(getRoomServiceErrorMessage(error, 'Unable to create room service order.'));
    }
  };

  const handleAssign = async (orderId) => {
    const staffId = String(assignInputs[orderId] || '').trim();
    if (!isUuid(staffId)) {
      setActionError('Staff ID must be a valid UUID.');
      return;
    }

    try {
      await assignStaff(orderId, staffId);
      setAssignInputs((current) => ({ ...current, [orderId]: '' }));
      setActionError('');
    } catch (error) {
      setActionError(getRoomServiceErrorMessage(error, 'Unable to assign staff to this order.'));
    }
  };

  const handleStatusUpdate = async (orderId, nextStatus) => {
    try {
      await updateStatus(orderId, nextStatus);
      setActionError('');
    } catch (error) {
      setActionError(getRoomServiceErrorMessage(error, 'Unable to update order status.'));
    }
  };

  const handleQuickLink = (orderId) => {
    document.getElementById(`room-service-order-${orderId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const permissionError = dashboardError && isRoomServicePermissionError(dashboardError)
    ? dashboardError
    : dailySummaryError && isRoomServicePermissionError(dailySummaryError)
      ? dailySummaryError
      : null;

  const generalDashboardError = dashboardError && !isRoomServicePermissionError(dashboardError) ? dashboardError : null;
  const generalSummaryError = dailySummaryError && !isRoomServicePermissionError(dailySummaryError) ? dailySummaryError : null;

  return (
    <div className="admin-shell room-service-shell">
      <main className="admin-page">
        <header className="page-header room-service-header">
          <div>
            <h1>Room Service Operations</h1>
            <p>
              Role: {user?.role || 'Unknown'} | Live updates:{' '}
              <ConnectionPill status={connectionStatus} />
            </p>
          </div>
          <div className="room-service-header-actions">
            <button className="secondary-btn action-btn" type="button" onClick={() => refreshDashboard()}>
              Refresh Dashboard
            </button>
            {canManageDashboard ? (
              <button className="secondary-btn action-btn" type="button" onClick={() => refreshDailySummary()}>
                Refresh Summary
              </button>
            ) : null}
          </div>
        </header>

        <ToastStack toasts={toasts} onDismiss={dismissToast} />

        {alertBanner ? (
          <section className="warning-note room-service-banner">
            <div>
              <strong>Stale Order Alert</strong>
              <p>{alertBanner.message}</p>
            </div>
            {alertBanner.orderId ? (
              <button className="action-btn" type="button" onClick={() => handleQuickLink(alertBanner.orderId)}>
                Jump to order
              </button>
            ) : null}
            <button className="secondary-btn action-btn" type="button" onClick={clearAlert}>
              Dismiss
            </button>
          </section>
        ) : null}

        {permissionError ? (
          <ErrorState
            title="Access restricted"
            message={getRoomServiceErrorMessage(permissionError, 'You do not have access to this room service dashboard.')}
            onRetry={refreshDashboard}
          />
        ) : null}

        {actionError ? <section className="warning-note">{actionError}</section> : null}

        {canManageDashboard ? (
          <section className="panel room-service-controls">
            <div className="page-header">
              <div>
                <h2 className="panel-title">Filter Orders</h2>
                <p>Narrow down results by floor and room number range.</p>
              </div>
            </div>
            <div className="room-service-filters-grid">
              <div className="room-service-filter-group">
                <label htmlFor="filter-floor">Floor</label>
                <input
                  id="filter-floor"
                  type="number"
                  placeholder="e.g., 2"
                  value={filters.floor}
                  onChange={(event) => {
                    clearFilterError();
                    setFilters((current) => ({ ...current, floor: event.target.value }));
                  }}
                  className="room-service-input"
                />
              </div>
              <div className="room-service-filter-group">
                <label htmlFor="filter-min-room">Min Room</label>
                <input
                  id="filter-min-room"
                  type="number"
                  placeholder="e.g., 100"
                  value={filters.minRoom}
                  onChange={(event) => {
                    clearFilterError();
                    setFilters((current) => ({ ...current, minRoom: event.target.value }));
                  }}
                  className="room-service-input"
                />
              </div>
              <div className="room-service-filter-group">
                <label htmlFor="filter-max-room">Max Room</label>
                <input
                  id="filter-max-room"
                  type="number"
                  placeholder="e.g., 210"
                  value={filters.maxRoom}
                  onChange={(event) => {
                    clearFilterError();
                    setFilters((current) => ({ ...current, maxRoom: event.target.value }));
                  }}
                  className="room-service-input"
                />
              </div>
            </div>
            <button className="action-btn room-service-apply-btn" type="button" onClick={() => applyFilters(buildFilterPayload(filters))}>
              Apply Filters
            </button>
            {filterError ? <p className="field-error">{filterError}</p> : null}
          </section>
        ) : null}

        {canCreate ? (
          <section className="panel room-service-create-panel">
            <div className="page-header">
              <div>
                <h2 className="panel-title">New Order</h2>
                <p>Create a room service order without leaving the dashboard.</p>
              </div>
            </div>

            <form className="room-service-create-form" onSubmit={handleCreateSubmit}>
              <div className="room-service-form-row">
                <div className="room-service-form-group">
                  <label htmlFor="create-room-number">Room Number</label>
                  <input
                    id="create-room-number"
                    type="number"
                    min="1"
                    placeholder="204"
                    value={createForm.roomNumber}
                    onChange={(event) => setCreateForm((current) => ({ ...current, roomNumber: event.target.value }))}
                    className="room-service-input"
                    required
                  />
                </div>

                <div className="room-service-form-group">
                  <label htmlFor="create-floor-number">Floor Number</label>
                  <input
                    id="create-floor-number"
                    type="number"
                    min="1"
                    placeholder="2"
                    value={createForm.floorNumber}
                    onChange={(event) => setCreateForm((current) => ({ ...current, floorNumber: event.target.value }))}
                    className="room-service-input"
                    required
                  />
                </div>
              </div>

              <div className="room-service-form-group room-service-form-full">
                <label htmlFor="create-items">Items Ordered</label>
                <input
                  id="create-items"
                  type="text"
                  placeholder="e.g., Club Sandwich, Orange Juice, Ice Cream"
                  value={createForm.itemsRaw}
                  onChange={(event) => setCreateForm((current) => ({ ...current, itemsRaw: event.target.value }))}
                  className="room-service-input"
                  required
                />
              </div>

              <div className="room-service-form-actions">
                <button className="action-btn" type="submit" disabled={operationState.create}>
                  {operationState.create ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </form>

            {createFormError ? <div className="room-service-form-error">{createFormError}</div> : null}
            {createFormSuccess ? <div className="room-service-form-success">{createFormSuccess}</div> : null}
          </section>
        ) : null}

        {!dashboardLoading && generalDashboardError ? (
          <ErrorState
            title="Room service dashboard unavailable"
            message={getRoomServiceErrorMessage(generalDashboardError, 'Unable to load active room service orders right now.')}
            onRetry={refreshDashboard}
          />
        ) : null}

        {!dashboardLoading && !generalDashboardError && !orders.length ? (
          <EmptyState
            title="No active room service orders"
            description="There are currently no active orders matching your filters."
          />
        ) : null}

        {dashboardLoading && !dashboard ? <LoadingSkeleton rows={8} /> : null}

        {!dashboardLoading && !generalDashboardError && orders.length ? (
          <section className="panel">
            <div className="page-header">
              <div>
                <h2 className="panel-title">Active Orders</h2>
                <p>Auto-refresh: {dashboard?.autoRefreshEnabled ? 'Enabled' : 'Disabled'} | Stale threshold: {dashboard?.staleThresholdMinutes || 0} min</p>
              </div>
            </div>

            <div className="room-service-orders-grid">
              {orders.map((order) => {
                const allowedNext = getAllowedStatuses(order.status);
                const isAssigning = operationState.assignOrderId === order.orderId;
                const isUpdatingStatus = operationState.statusOrderId === order.orderId;

                return (
                  <article
                    key={order.orderId}
                    id={`room-service-order-${order.orderId}`}
                    className={`card room-service-order-card ${order.staleFlag ? 'card-alert room-service-order-stale' : ''}`}
                  >
                    <div className="page-header room-service-order-header">
                      <div>
                        <h3>Order #{order.orderId} | Room {order.roomNumber} (Floor {order.floorNumber})</h3>
                        <p>Placed: {formatDateTime(order.placedAt)}</p>
                      </div>
                      <div className="room-service-order-badges">
                        <StatusBadge status={order.status} />
                        {order.staleFlag ? <span className="badge badge-danger">STALE</span> : null}
                      </div>
                    </div>

                    <div className="room-service-order-meta">
                      <p><strong>Assigned Staff:</strong> {order.assignedStaffName || 'Unassigned'}</p>
                      <p><strong>Last Status Update:</strong> {formatDateTime(order.lastStatusUpdatedAt)}</p>
                    </div>

                    <div className="room-service-items">
                      <strong>Items</strong>
                      <ul>
                        {order.itemsOrdered.map((item, index) => (
                          <li key={`${order.orderId}-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="room-service-order-actions">
                      {canAssign ? (
                        <div className="room-service-assign-row">
                          <input
                            type="text"
                            placeholder="Staff UUID"
                            value={assignInputs[order.orderId] || ''}
                            onChange={(event) =>
                              setAssignInputs((current) => ({ ...current, [order.orderId]: event.target.value }))
                            }
                          />
                          <button
                            className="action-btn"
                            type="button"
                            disabled={isAssigning}
                            onClick={() => handleAssign(order.orderId)}
                          >
                            {isAssigning ? 'Assigning...' : 'Assign Staff'}
                          </button>
                        </div>
                      ) : null}

                      {canUpdateStatus ? (
                        <div className="room-service-status-actions">
                          {allowedNext.length ? (
                            allowedNext.map((nextStatus) => (
                              <button
                                key={nextStatus}
                                className="secondary-btn action-btn"
                                type="button"
                                disabled={isUpdatingStatus}
                                onClick={() => handleStatusUpdate(order.orderId, nextStatus)}
                              >
                                Mark {STATUS_LABELS[nextStatus] || nextStatus}
                              </button>
                            ))
                          ) : (
                            <span className="room-service-static-status">No further transitions</span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {canManageDashboard ? (
          <section className="panel room-service-summary-panel">
            <div className="page-header">
              <div>
                <h2 className="panel-title">Daily Ops Summary</h2>
                <p>Daily totals and unresolved orders for the selected business date.</p>
              </div>
              <input
                type="date"
                value={summaryDate}
                onChange={(event) => setSummaryDate(event.target.value)}
                max={toTodayDate()}
              />
            </div>

            {dailySummaryLoading ? <LoadingSkeleton rows={3} /> : null}

            {!dailySummaryLoading && generalSummaryError ? (
              <ErrorState
                title="Summary unavailable"
                message={getRoomServiceErrorMessage(generalSummaryError, 'Unable to load the daily operations summary.')}
                onRetry={refreshDailySummary}
              />
            ) : null}

            {!dailySummaryLoading && !generalSummaryError && dailySummary ? (
              <>
                <div className="kv room-service-summary-kv">
                  <div className="kv-item">
                    <p className="kv-label">Total Orders</p>
                    <p className="kv-value">{dailySummary.totalOrders}</p>
                  </div>
                  <div className="kv-item">
                    <p className="kv-label">Avg Delivery Minutes</p>
                    <p className="kv-value">{dailySummary.averageDeliveryMinutes}</p>
                  </div>
                  <div className="kv-item">
                    <p className="kv-label">Unresolved Orders</p>
                    <p className="kv-value">{dailySummary.unresolvedOrdersCount}</p>
                  </div>
                </div>

                {dailySummary.unresolvedOrders?.length ? (
                  <div className="room-service-unresolved">
                    <h3>Unresolved Orders</h3>
                    <div className="list">
                      {dailySummary.unresolvedOrders.map((order) => (
                        <button
                          key={order.orderId}
                          type="button"
                          className="card room-service-unresolved-card"
                          onClick={() => handleQuickLink(order.orderId)}
                        >
                          <strong>Room {order.roomNumber} | Order #{order.orderId}</strong>
                          <p>Status: {order.status} | Last update: {formatTime(order.lastStatusUpdatedAt)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="No unresolved orders"
                    description="All orders for the selected date have been resolved."
                  />
                )}
              </>
            ) : null}
          </section>
        ) : null}

        {canUpdateStatus && !canManageDashboard ? (
          <section className="panel">
            <div className="page-header">
              <div>
                <h2 className="panel-title">Staff Status Update</h2>
                <p>Staff can update order status directly using an order ID.</p>
              </div>
            </div>
            <p className="warning-note">Use the status controls in each order card to move an order through the workflow.</p>
          </section>
        ) : null}
      </main>
    </div>
  );
}
