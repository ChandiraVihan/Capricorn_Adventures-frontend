import { EventSourcePolyfill } from 'event-source-polyfill';
import { BACKEND_BASE_URL } from './config';
import { authService } from './authService';
import { apiRequest, createQuery } from './httpClient';

/** @typedef {'RECEIVED'|'PREPARING'|'DELIVERED'} RoomServiceStatus */
/** @typedef {'ORDER_RECEIVED'|'ORDER_ASSIGNED'|'ORDER_STATUS_UPDATED'|'ORDER_STALE_ALERT'} RoomServiceEventType */

/**
 * @typedef {Object} RoomServiceOrderCard
 * @property {number} orderId
 * @property {number} roomNumber
 * @property {number} floorNumber
 * @property {string[]} itemsOrdered
 * @property {string} placedAt
 * @property {string|null} assignedStaffId
 * @property {string|null} assignedStaffName
 * @property {RoomServiceStatus} status
 * @property {boolean} staleFlag
 * @property {string} lastStatusUpdatedAt
 */

/**
 * @typedef {Object} RoomServiceDashboardResponse
 * @property {string} generatedAt
 * @property {boolean} autoRefreshEnabled
 * @property {number} staleThresholdMinutes
 * @property {RoomServiceOrderCard[]} activeOrders
 */

/**
 * @typedef {Object} RoomServiceDailySummaryResponse
 * @property {string} businessDate
 * @property {number} totalOrders
 * @property {number} averageDeliveryMinutes
 * @property {number} unresolvedOrdersCount
 * @property {RoomServiceOrderCard[]} unresolvedOrders
 */

/**
 * @typedef {Object} RoomServiceStreamEvent
 * @property {RoomServiceEventType} eventType
 * @property {string} message
 * @property {string} occurredAt
 * @property {RoomServiceOrderCard|null} order
 */

function createRoomServiceApiError(error, fallbackMessage = 'Room service request failed') {
  const payload = error?.payload ?? null;
  const fieldErrors = payload?.messages && typeof payload.messages === 'object' ? payload.messages : {};
  const generalMessage =
    payload?.general ||
    payload?.message ||
    payload?.error ||
    error?.message ||
    fallbackMessage;

  const normalizedError = new Error(generalMessage);
  normalizedError.status = error?.status;
  normalizedError.payload = payload;
  normalizedError.fieldErrors = fieldErrors;
  normalizedError.generalMessage = generalMessage;
  normalizedError.isRoomServiceError = true;
  return normalizedError;
}

async function request(path, options = {}, fallbackMessage) {
  try {
    return await apiRequest(path, options);
  } catch (error) {
    throw createRoomServiceApiError(error, fallbackMessage);
  }
}

/** @param {{floor?:number|string, minRoom?:number|string, maxRoom?:number|string}} filters */
export function fetchRoomServiceDashboard(filters = {}) {
  const query = createQuery(filters);
  return request(`/room-service/orders/dashboard${query}`, {}, 'Unable to load room service dashboard');
}

/** @param {{roomNumber:number, floorNumber:number, itemsOrdered:string[]}} payload */
export function createRoomServiceOrder(payload) {
  return request(
    '/room-service/orders',
    {
      method: 'POST',
      body: payload,
    },
    'Unable to create room service order',
  );
}

/** @param {number} orderId @param {string} staffId */
export function assignRoomServiceStaff(orderId, staffId) {
  return request(
    `/room-service/orders/${orderId}/assign`,
    {
      method: 'PATCH',
      body: { staffId },
    },
    'Unable to assign staff to room service order',
  );
}

/** @param {number} orderId @param {RoomServiceStatus} status */
export function updateRoomServiceOrderStatus(orderId, status) {
  return request(
    `/room-service/orders/${orderId}/status`,
    {
      method: 'PATCH',
      body: { status },
    },
    'Unable to update room service order status',
  );
}

/** @param {string=} date */
export function fetchRoomServiceDailySummary(date) {
  const query = createQuery({ date });
  return request(`/room-service/orders/daily-summary${query}`, {}, 'Unable to load room service summary');
}

/**
 * Connect to the dashboard stream.
 * @param {(event: RoomServiceStreamEvent) => void} onEvent
 * @param {{ onStatusChange?: (status: 'connected'|'reconnecting'|'offline') => void, onError?: (error: Error) => void }} [options]
 * @returns {() => void}
 */
export function connectRoomServiceDashboardStream(onEvent, options = {}) {
  const { onStatusChange, onError } = options;
  const streamUrl = `${BACKEND_BASE_URL}/api/room-service/orders/dashboard/stream`;
  const token = authService.getToken();
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const source = new EventSourcePolyfill(streamUrl, {
    headers,
    heartbeatTimeout: 30000,
    withCredentials: false,
  });

  const eventTypes = ['ORDER_RECEIVED', 'ORDER_ASSIGNED', 'ORDER_STATUS_UPDATED', 'ORDER_STALE_ALERT'];

  const forwardEvent = (eventType) => (event) => {
    try {
      const payload = JSON.parse(event.data);
      onEvent({
        eventType: payload.eventType || eventType,
        message: payload.message || '',
        occurredAt: payload.occurredAt || '',
        order: payload.order || null,
      });
    } catch {
      onEvent({
        eventType,
        message: '',
        occurredAt: '',
        order: null,
      });
    }
  };

  eventTypes.forEach((eventType) => {
    source.addEventListener(eventType, forwardEvent(eventType));
  });

  source.onopen = () => {
    onStatusChange?.('connected');
  };

  source.onerror = () => {
    onStatusChange?.('offline');
    onError?.(new Error('Room service live updates are temporarily unavailable.'));
  };

  return () => {
    source.close();
  };
}

export function createRoomServiceApiErrorMessage(error) {
  return error?.generalMessage || error?.message || 'Room service request failed';
}
