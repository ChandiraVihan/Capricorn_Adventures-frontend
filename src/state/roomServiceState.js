const ROOM_SERVICE_STATUS_FLOW = {
  RECEIVED: ['PREPARING'],
  PREPARING: ['DELIVERED'],
  DELIVERED: [],
};

function normalizeStatus(status) {
  return String(status || '').trim().toUpperCase();
}

function getOrderTimestamp(order) {
  const source = order?.lastStatusUpdatedAt || order?.placedAt || '';
  const value = Date.parse(source);
  return Number.isFinite(value) ? value : 0;
}

export function normalizeRoomServiceOrder(order) {
  if (!order) return null;
  return {
    ...order,
    orderId: Number(order.orderId),
    roomNumber: Number(order.roomNumber),
    floorNumber: Number(order.floorNumber),
    itemsOrdered: Array.isArray(order.itemsOrdered) ? order.itemsOrdered : [],
    assignedStaffId: order.assignedStaffId ?? null,
    assignedStaffName: order.assignedStaffName ?? null,
    status: normalizeStatus(order.status),
    staleFlag: Boolean(order.staleFlag),
    lastStatusUpdatedAt: order.lastStatusUpdatedAt || order.placedAt || '',
  };
}

export function getRoomServiceNextStatuses(status) {
  return ROOM_SERVICE_STATUS_FLOW[normalizeStatus(status)] || [];
}

export function upsertRoomServiceOrder(orders, order) {
  const normalized = normalizeRoomServiceOrder(order);
  if (!normalized) return Array.isArray(orders) ? [...orders] : [];

  const byId = new Map();
  (Array.isArray(orders) ? orders : []).forEach((existing) => {
    const item = normalizeRoomServiceOrder(existing);
    if (item) byId.set(item.orderId, item);
  });
  byId.set(normalized.orderId, normalized);

  return Array.from(byId.values()).sort((left, right) => {
    if (left.staleFlag !== right.staleFlag) {
      return Number(right.staleFlag) - Number(left.staleFlag);
    }

    const timeDelta = getOrderTimestamp(right) - getOrderTimestamp(left);
    if (timeDelta) return timeDelta;

    return right.orderId - left.orderId;
  });
}

export function removeRoomServiceOrder(orders, orderId) {
  return (Array.isArray(orders) ? orders : []).filter((order) => Number(order.orderId) !== Number(orderId));
}

export function mapRoomServiceStreamEventToOrders(orders, event) {
  const currentOrders = Array.isArray(orders) ? orders : [];
  if (!event?.order) return currentOrders;
  return upsertRoomServiceOrder(currentOrders, event.order);
}

export function createRoomServiceToast(event) {
  if (!event?.eventType) return null;
  const titleMap = {
    ORDER_RECEIVED: 'New room service order received',
    ORDER_ASSIGNED: 'Staff assigned to room service order',
    ORDER_STATUS_UPDATED: 'Room service order status updated',
    ORDER_STALE_ALERT: 'Stale order alert',
  };

  return {
    id: `${event.eventType}-${event.order?.orderId || 'unknown'}-${event.occurredAt || Date.now()}`,
    type: event.eventType === 'ORDER_STALE_ALERT' ? 'warning' : 'success',
    title: titleMap[event.eventType] || 'Room service update',
    message: event.message || '',
    orderId: event.order?.orderId ?? null,
    occurredAt: event.occurredAt || '',
  };
}

export function createRoomServiceAlert(event) {
  if (event?.eventType !== 'ORDER_STALE_ALERT') return null;
  return {
    orderId: event.order?.orderId ?? null,
    message: event.message || 'An order has been marked stale.',
    occurredAt: event.occurredAt || '',
  };
}

export function isRoomServicePermissionError(error) {
  const status = Number(error?.status);
  return status === 401 || status === 403;
}

export function getRoomServiceErrorMessage(error, fallback = 'Room service request failed') {
  return error?.generalMessage || error?.message || fallback;
}
