import { useCallback, useEffect, useRef, useState } from 'react';
import {
  assignRoomServiceStaff,
  connectRoomServiceDashboardStream,
  createRoomServiceOrder,
  fetchRoomServiceDailySummary,
  fetchRoomServiceDashboard,
  updateRoomServiceOrderStatus,
} from '../api/roomServiceApi';
import {
  createRoomServiceAlert,
  createRoomServiceToast,
  getRoomServiceErrorMessage,
  getRoomServiceNextStatuses,
  isRoomServicePermissionError,
  mapRoomServiceStreamEventToOrders,
  normalizeRoomServiceOrder,
  upsertRoomServiceOrder,
} from '../state/roomServiceState';

function toTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function isValidFilterRange(filters) {
  const minRoom = filters?.minRoom === '' ? null : Number(filters?.minRoom);
  const maxRoom = filters?.maxRoom === '' ? null : Number(filters?.maxRoom);
  if (Number.isFinite(minRoom) && Number.isFinite(maxRoom)) {
    return minRoom <= maxRoom;
  }
  return true;
}

function makeOperationError(error, fallbackMessage) {
  return {
    status: error?.status ?? null,
    message: getRoomServiceErrorMessage(error, fallbackMessage),
    fieldErrors: error?.fieldErrors || {},
    permissionDenied: isRoomServicePermissionError(error),
  };
}

export function useRoomServiceOperations() {
  const [filters, setFilters] = useState({ floor: '', minRoom: '', maxRoom: '' });
  const [appliedFilters, setAppliedFilters] = useState({ floor: '', minRoom: '', maxRoom: '' });
  const [summaryDate, setSummaryDate] = useState(toTodayDate());
  const [dashboard, setDashboard] = useState(null);
  const [dailySummary, setDailySummary] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dailySummaryLoading, setDailySummaryLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);
  const [dailySummaryError, setDailySummaryError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('offline');
  const [toasts, setToasts] = useState([]);
  const [alertBanner, setAlertBanner] = useState(null);
  const [filterError, setFilterError] = useState('');
  const [operationState, setOperationState] = useState({
    create: false,
    assignOrderId: null,
    statusOrderId: null,
  });

  const dashboardRef = useRef(null);
  const disconnectRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const currentSummaryDateRef = useRef(summaryDate);

  dashboardRef.current = dashboard;
  currentSummaryDateRef.current = summaryDate;

  const pushToast = useCallback((toast) => {
    setToasts((current) => [
      ...current,
      {
        id: toast.id || `${toast.type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type: toast.type || 'info',
        title: toast.title || 'Update',
        message: toast.message || '',
        orderId: toast.orderId ?? null,
      },
    ]);
  }, []);

  const dismissToast = useCallback((toastId) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }, []);

  const loadDashboard = useCallback(
    async (nextFilters = appliedFilters) => {
      try {
        setDashboardError(null);
        setDashboardLoading(true);
        const response = await fetchRoomServiceDashboard(nextFilters);
        const normalized = {
          ...response,
          activeOrders: (response?.activeOrders || []).map(normalizeRoomServiceOrder).filter(Boolean),
        };
        setDashboard(normalized);
        setAppliedFilters(nextFilters);
        return normalized;
      } catch (error) {
        const normalizedError = makeOperationError(error, 'Unable to load active room service orders.');
        setDashboardError(normalizedError);
        return null;
      } finally {
        setDashboardLoading(false);
      }
    },
    [appliedFilters],
  );

  const loadDailySummary = useCallback(async (date = currentSummaryDateRef.current) => {
    if (!date) {
      setDailySummary(null);
      setDailySummaryLoading(false);
      return null;
    }

    try {
      setDailySummaryError(null);
      setDailySummaryLoading(true);
      const response = await fetchRoomServiceDailySummary(date);
      setDailySummary(response);
      return response;
    } catch (error) {
      const normalizedError = makeOperationError(error, 'Unable to load daily room service summary.');
      setDailySummaryError(normalizedError);
      setDailySummary(null);
      return null;
    } finally {
      setDailySummaryLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadDashboard(appliedFilters), loadDailySummary(summaryDate)]);
  }, [appliedFilters, loadDashboard, loadDailySummary, summaryDate]);

  const applyFilters = useCallback(
    async (nextFilters = filters) => {
      if (!isValidFilterRange(nextFilters)) {
        setFilterError('Minimum room must be less than or equal to maximum room.');
        return false;
      }

      setFilterError('');
      setAppliedFilters(nextFilters);
      return true;
    },
    [filters],
  );

  const handleStreamEvent = useCallback(
    (event) => {
      if (!event?.order) return;

      setConnectionStatus('connected');
      setDashboard((current) => {
        const currentOrders = current?.activeOrders || [];
        const nextOrders = mapRoomServiceStreamEventToOrders(currentOrders, event);
        if (!current) return current;
        return {
          ...current,
          activeOrders: nextOrders,
        };
      });

      if (event.eventType === 'ORDER_STALE_ALERT') {
        setAlertBanner(createRoomServiceAlert(event));
      }

      const toast = createRoomServiceToast(event);
      if (toast) {
        pushToast(toast);
      }
    },
    [pushToast],
  );

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) return;
    const delay = Math.min(3000 * (reconnectAttemptsRef.current + 1), 15000);
    reconnectAttemptsRef.current += 1;
    reconnectTimerRef.current = window.setTimeout(() => {
      reconnectTimerRef.current = null;
      if (disconnectRef.current) {
        disconnectRef.current();
      }
      disconnectRef.current = connectRoomServiceDashboardStream(handleStreamEvent, {
        onStatusChange: setConnectionStatus,
        onError: () => {
          setConnectionStatus('reconnecting');
          scheduleReconnect();
        },
      });
    }, delay);
  }, [handleStreamEvent]);

  useEffect(() => {
    loadDashboard(appliedFilters);
  }, [appliedFilters, loadDashboard]);

  useEffect(() => {
    loadDailySummary(summaryDate);
  }, [loadDailySummary, summaryDate]);

  useEffect(() => {
    if (!dashboard?.autoRefreshEnabled || !dashboard?.refreshIntervalSeconds) return undefined;
    const timer = window.setInterval(() => {
      loadDashboard(appliedFilters);
    }, dashboard.refreshIntervalSeconds * 1000);
    return () => clearInterval(timer);
  }, [appliedFilters, dashboard?.autoRefreshEnabled, dashboard?.refreshIntervalSeconds, loadDashboard]);

  useEffect(() => {
    disconnectRef.current?.();
    disconnectRef.current = null;
    reconnectAttemptsRef.current = 0;
    if (!dashboard) return undefined;

    setConnectionStatus('connecting');
    disconnectRef.current = connectRoomServiceDashboardStream(handleStreamEvent, {
      onStatusChange: setConnectionStatus,
      onError: () => {
        setConnectionStatus('reconnecting');
        scheduleReconnect();
      },
    });

    return () => {
      disconnectRef.current?.();
      disconnectRef.current = null;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [dashboard?.generatedAt, handleStreamEvent, scheduleReconnect]);

  const createOrder = useCallback(
    async (payload) => {
      try {
        setOperationState((current) => ({ ...current, create: true }));
        const created = await createRoomServiceOrder(payload);
        const nextOrder = normalizeRoomServiceOrder(created);
        if (nextOrder) {
          setDashboard((current) => {
            if (!current) return current;
            return {
              ...current,
              activeOrders: upsertRoomServiceOrder(current.activeOrders || [], nextOrder),
            };
          });
          pushToast({
            type: 'success',
            title: 'Order created',
            message: `Room ${nextOrder.roomNumber} order created successfully.`,
            orderId: nextOrder.orderId,
          });
        }
        await refreshAll();
        return created;
      } catch (error) {
        throw makeOperationError(error, 'Unable to create room service order.');
      } finally {
        setOperationState((current) => ({ ...current, create: false }));
      }
    },
    [pushToast, refreshAll],
  );

  const assignStaff = useCallback(
    async (orderId, staffId) => {
      const previousOrders = dashboardRef.current?.activeOrders || [];
      const optimisticOrders = previousOrders.map((order) =>
        Number(order.orderId) === Number(orderId)
          ? {
              ...order,
              assignedStaffId: staffId,
              assignedStaffName: 'Updating...',
            }
          : order,
      );
      setDashboard((current) => (current ? { ...current, activeOrders: optimisticOrders } : current));

      try {
        setOperationState((current) => ({ ...current, assignOrderId: orderId }));
        const updated = await assignRoomServiceStaff(orderId, staffId);
        const nextOrder = normalizeRoomServiceOrder(updated);
        if (nextOrder) {
          setDashboard((current) => {
            if (!current) return current;
            return {
              ...current,
              activeOrders: upsertRoomServiceOrder(current.activeOrders || [], nextOrder),
            };
          });
        }
        pushToast({
          type: 'success',
          title: 'Staff assigned',
          message: 'Assignment saved. Push notification request sent to backend hook.',
          orderId,
        });
        await loadDashboard(appliedFilters);
        return updated;
      } catch (error) {
        setDashboard((current) =>
          current ? { ...current, activeOrders: previousOrders } : current,
        );
        throw makeOperationError(error, 'Unable to assign staff to this order.');
      } finally {
        setOperationState((current) => ({ ...current, assignOrderId: null }));
      }
    },
    [appliedFilters, loadDashboard, pushToast],
  );

  const updateStatus = useCallback(
    async (orderId, status) => {
      const previousOrders = dashboardRef.current?.activeOrders || [];
      const optimisticOrders = previousOrders.map((order) =>
        Number(order.orderId) === Number(orderId)
          ? {
              ...order,
              status,
              lastStatusUpdatedAt: new Date().toISOString(),
            }
          : order,
      );
      setDashboard((current) => (current ? { ...current, activeOrders: optimisticOrders } : current));

      try {
        setOperationState((current) => ({ ...current, statusOrderId: orderId }));
        const updated = await updateRoomServiceOrderStatus(orderId, status);
        const nextOrder = normalizeRoomServiceOrder(updated);
        if (nextOrder) {
          setDashboard((current) => {
            if (!current) return current;
            return {
              ...current,
              activeOrders: upsertRoomServiceOrder(current.activeOrders || [], nextOrder),
            };
          });
        }
        pushToast({
          type: 'success',
          title: 'Status updated',
          message: `Order ${orderId} moved to ${status}.`,
          orderId,
        });
        await loadDashboard(appliedFilters);
        return updated;
      } catch (error) {
        setDashboard((current) =>
          current ? { ...current, activeOrders: previousOrders } : current,
        );
        throw makeOperationError(error, 'Unable to update order status.');
      } finally {
        setOperationState((current) => ({ ...current, statusOrderId: null }));
      }
    },
    [appliedFilters, loadDashboard, pushToast],
  );

  const clearAlert = useCallback(() => {
    setAlertBanner(null);
  }, []);

  return {
    filters,
    setFilters,
    appliedFilters,
    applyFilters,
    filterError,
    clearFilterError: () => setFilterError(''),
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
    refreshDashboard: () => loadDashboard(appliedFilters),
    refreshDailySummary: () => loadDailySummary(summaryDate),
    loadDailySummary,
    isRoomServiceDashboardReady: Boolean(dashboard),
    canShowLiveUpdates: dashboard?.autoRefreshEnabled !== false,
    getAllowedStatuses: getRoomServiceNextStatuses,
  };
}
