import { apiRequest, createQuery } from './httpClient';

/** @typedef {'Upcoming'|'In Progress'|'Completed'|'Cancelled'} TourStatus */
/** @typedef {'HIGH'|'MEDIUM'|'LOW'|string} Priority */
/** @typedef {'ROOM_SERVICE'|'HOUSEKEEPING'|'LAUNDRY'} DepartmentCode */
/** @typedef {'RECEIVED'|'PREPARING'|'DELIVERED'} RoomServiceStatus */

/** @typedef {'SUCCESS'|'FAILED'|'REFUNDED'|'PENDING'|string} PaymentStatus */

/**
 * @typedef {Object} ManagerTour
 * @property {number} scheduleId
 * @property {number} adventureId
 * @property {string} adventureName
 * @property {string} startDateTime
 * @property {string} endDateTime
 * @property {TourStatus} status
 * @property {string|null} assignedGuideName
 * @property {boolean} guideAssigned
 * @property {boolean} guideAssignmentRequired
 * @property {string} quickActionLabel
 * @property {number} checkedInCustomerCount
 * @property {number} availableSlots
 * @property {number} totalCapacity
 */

/**
 * @typedef {Object} ManagerIssue
 * @property {number} alertId
 * @property {number} scheduleId
 * @property {string} type
 * @property {Priority} priority
 * @property {string} title
 * @property {string} message
 * @property {string} raisedAt
 */

/**
 * @typedef {Object} WeeklyOccupancyItem
 * @property {string} date
 * @property {string} dayLabel
 * @property {number} bookedCapacity
 * @property {number} availableCapacity
 * @property {number} totalCapacity
 */

/**
 * @typedef {Object} ManagerOperationsDashboardResponse
 * @property {string} businessDate
 * @property {string} generatedAt
 * @property {boolean} autoRefreshEnabled
 * @property {number} refreshIntervalSeconds
 * @property {ManagerTour[]} todayTours
 * @property {ManagerIssue[]} issues
 * @property {WeeklyOccupancyItem[]} weeklyOccupancy
 */

/**
 * @typedef {Object} MetricBlock
 * @property {string} title
 * @property {number} actual
 * @property {number} budget
 * @property {number} variance
 * @property {'green'|'red'} varianceColor
 * @property {number} monthOverMonthChangePercent
 */

/**
 * @typedef {Object} FinanceLineItem
 * @property {string} category
 * @property {string} label
 * @property {number} amount
 */

/**
 * @typedef {Object} FinancePnlResponse
 * @property {string} month
 * @property {boolean} monthToDate
 * @property {string} generatedAt
 * @property {MetricBlock} revenue
 * @property {MetricBlock} costOfSales
 * @property {MetricBlock} grossMargin
 * @property {MetricBlock} netProfitPreTax
 * @property {MetricBlock} netProfitPostTax
 * @property {{ hotelRevenue:number, adventureRevenue:number, thirdPartyCommission:number }} productBreakdown
 * @property {{ taxRatePercent:number, taxAmount:number, netProfitPreTax:number, netProfitPostTax:number }} taxSummary
 * @property {FinanceLineItem[]} lineItems
 */

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
 * @typedef {Object} ShiftStaff
 * @property {number} shiftId
 * @property {string} staffId
 * @property {string} staffName
 * @property {string} shiftStartAt
 * @property {string|null} currentTaskAssignment
 * @property {string|null} lastActivityAt
 */

/**
 * @typedef {Object} ShiftDepartment
 * @property {DepartmentCode} departmentCode
 * @property {string} departmentName
 * @property {boolean} understaffed
 * @property {string|null} warning
 * @property {ShiftStaff[]} onShiftStaff
 */

/**
 * @typedef {Object} ShiftOverviewResponse
 * @property {string} generatedAt
 * @property {boolean} autoRefreshEnabled
 * @property {number} refreshIntervalSeconds
 * @property {ShiftDepartment[]} departments
 * @property {{ businessDate:string, totalLaborHours:number, estimatedShiftCost:number }|null} ownerMetrics
 */

/**
 * @typedef {Object} GuideAssignmentResponse
 * @property {number} scheduleId
 * @property {string|null} assignedGuideName
 * @property {boolean} guideAssigned
 * @property {boolean} guideAssignmentRequired
 * @property {string|null} quickActionLabel
 */

/**
 * @typedef {Object} ManagerRoomPurchase
 * @property {string|number} id
 * @property {string} transactionId
 * @property {string} bookingReferenceId
 * @property {number|null} bookingId
 * @property {string} guestName
 * @property {string} guestEmail
 * @property {string} roomName
 * @property {number|null} roomNumber
 * @property {number} amount
 * @property {string} currency
 * @property {PaymentStatus} status
 * @property {string|null} purchasedAt
 */

function toLocalDateTime(value) {
  const offset = value.getTimezoneOffset() * 60000;
  const local = new Date(value.getTime() - offset);
  return local.toISOString().slice(0, 19);
}

function normalizeFinanceDateParam(input, fallbackDate, endOfDay = false) {
  const source = String(input || '').trim();
  if (!source) {
    const base = new Date(fallbackDate);
    if (endOfDay) base.setHours(23, 59, 59, 0);
    else base.setHours(0, 0, 0, 0);
    return toLocalDateTime(base);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(source)) {
    return `${source}${endOfDay ? 'T23:59:59' : 'T00:00:00'}`;
  }

  return source;
}

function normalizeGuestName(payment, booking) {
  const guest = booking?.guest || booking?.user || payment?.guest || payment?.user;
  const combinedName = [guest?.firstName, guest?.lastName].filter(Boolean).join(' ').trim();
  return (
    booking?.guestName ||
    payment?.guestName ||
    payment?.customerName ||
    guest?.fullName ||
    combinedName ||
    'Unknown Guest'
  );
}

function normalizeManagerRoomPurchase(payment, index = 0) {
  const booking = payment?.booking || {};
  const room = booking?.room || payment?.room || {};

  return {
    id: payment?.id ?? payment?.transactionId ?? booking?.referenceId ?? `purchase-${index}`,
    transactionId: String(payment?.transactionId || payment?.gatewayTransactionId || payment?.id || '-'),
    bookingReferenceId: String(booking?.referenceId || payment?.bookingReferenceId || booking?.reference || '-'),
    bookingId: Number.isFinite(Number(booking?.id ?? payment?.bookingId))
      ? Number(booking?.id ?? payment?.bookingId)
      : null,
    guestName: normalizeGuestName(payment, booking),
    guestEmail: String(booking?.guestEmail || payment?.customerEmail || ''),
    roomName: String(room?.name || booking?.roomName || payment?.roomName || ''),
    roomNumber: Number.isFinite(Number(room?.roomNumber ?? booking?.roomNumber ?? payment?.roomNumber))
      ? Number(room?.roomNumber ?? booking?.roomNumber ?? payment?.roomNumber)
      : null,
    amount: Number(payment?.amount || payment?.totalAmount || 0),
    currency: String(payment?.currency || 'LKR'),
    status: String(payment?.status || 'PENDING').toUpperCase(),
    purchasedAt: payment?.createdAt || payment?.paidAt || payment?.updatedAt || null,
  };
}

/** @returns {Promise<ManagerOperationsDashboardResponse>} */
export function getManagerOperationsDashboard() {
  return apiRequest('/manager/operations/dashboard');
}

/** @param {string=} month @returns {Promise<FinancePnlResponse>} */
export function getFinancePnl(month) {
  const query = createQuery({ month });
  return apiRequest(`/finance/pnl${query}`);
}

/** @param {string=} month @returns {Promise<Blob>} */
export function exportFinancePnl(month) {
  const query = createQuery({ month });
  return apiRequest(`/finance/pnl/export${query}`, { responseType: 'blob' });
}

/** @param {{roomNumber:number, floorNumber:number, itemsOrdered:string[]}} payload */
export function createRoomServiceOrder(payload) {
  return apiRequest('/room-service/orders', {
    method: 'POST',
    body: payload,
  });
}

/** @param {number} orderId @param {{staffId:string}} payload */
export function assignRoomServiceOrder(orderId, payload) {
  return apiRequest(`/room-service/orders/${orderId}/assign`, {
    method: 'PATCH',
    body: payload,
  });
}

/** @param {number} orderId @param {{status:RoomServiceStatus}} payload */
export function updateRoomServiceOrderStatus(orderId, payload) {
  return apiRequest(`/room-service/orders/${orderId}/status`, {
    method: 'PATCH',
    body: payload,
  });
}

/** @param {number} orderId */
export function deleteRoomServiceOrder(orderId) {
  return apiRequest(`/room-service/orders/${orderId}`, {
    method: 'DELETE',
  });
}

/**
 * @param {{floor?:number|string, minRoom?:number|string, maxRoom?:number|string}} filters
 * @returns {Promise<RoomServiceDashboardResponse>}
 */
export function getRoomServiceDashboard(filters = {}) {
  const query = createQuery(filters);
  return apiRequest(`/room-service/orders/dashboard${query}`);
}

/** @param {string} date @returns {Promise<RoomServiceDailySummaryResponse>} */
export function getRoomServiceDailySummary(date) {
  const query = createQuery({ date });
  return apiRequest(`/room-service/orders/daily-summary${query}`);
}

/** @returns {Promise<ShiftOverviewResponse>} */
export function getShiftOverview() {
  return apiRequest('/manager/operations/shift-overview');
}

/**
 * @param {number} scheduleId
 * @param {{staffId?:string, guideId?:string, assignedGuideId?:string, shiftId?:string|number|null}} payload
 * @returns {Promise<GuideAssignmentResponse>}
 */
export function assignGuideToTour(scheduleId, payload) {
  const guideIdentifier = String(
    payload?.staffId || payload?.guideId || payload?.assignedGuideId || '',
  ).trim();
  const shiftIdentifier = payload?.shiftId ?? null;

  const attempts = [
    { method: 'PATCH', body: { staffId: guideIdentifier } },
    { method: 'PATCH', body: { guideId: guideIdentifier } },
    { method: 'PATCH', body: { assignedGuideId: guideIdentifier } },
    { method: 'PATCH', body: shiftIdentifier !== null && shiftIdentifier !== '' ? { shiftId: shiftIdentifier } : null },
    { method: 'POST', body: { staffId: guideIdentifier } },
    { method: 'POST', body: { guideId: guideIdentifier } },
    { method: 'POST', body: { assignedGuideId: guideIdentifier } },
    { method: 'POST', body: shiftIdentifier !== null && shiftIdentifier !== '' ? { shiftId: shiftIdentifier } : null },
  ].filter((attempt) => attempt.body && Object.keys(attempt.body).length > 0);

  return (async () => {
    let lastError = null;

    for (const attempt of attempts) {
      try {
        return await apiRequest(`/manager/operations/tours/${scheduleId}/assign-guide`, {
          method: attempt.method,
          body: attempt.body,
        });
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('Unable to assign guide to tour');
  })();
}

/**
 * @param {{from?:string, to?:string, limit?:number, statuses?:string[]}} [options]
 * @returns {Promise<ManagerRoomPurchase[]>}
 */
export async function getManagerRoomPurchases(options = {}) {
  const defaultToDate = new Date();
  const defaultFromDate = new Date(defaultToDate);
  defaultFromDate.setDate(defaultToDate.getDate() - 30);

  const from = normalizeFinanceDateParam(options.from, defaultFromDate, false);
  const to = normalizeFinanceDateParam(options.to, defaultToDate, true);
  const limit = Number.isFinite(Number(options.limit)) ? Number(options.limit) : 20;
  const statuses = Array.isArray(options.statuses) && options.statuses.length
    ? options.statuses.map((status) => String(status).toUpperCase())
    : [];

  let response;
  try {
    const query = createQuery({ from, to });
    response = await apiRequest(`/finance/payments${query}`);
  } catch (error) {
    // Some backend variants reject date-filter params for this endpoint; retry without query.
    if (Number(error?.status) !== 400) {
      throw error;
    }
    response = await apiRequest('/finance/payments');
  }

  const payments = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.payments)
        ? response.payments
        : [];

  const normalized = payments
    .map((payment, index) => normalizeManagerRoomPurchase(payment, index))
    .filter((purchase) => {
      if (!statuses.length) return true;
      return statuses.includes(String(purchase.status || '').toUpperCase());
    })
    .sort((left, right) => {
      const leftTime = Date.parse(left.purchasedAt || '');
      const rightTime = Date.parse(right.purchasedAt || '');
      return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0);
    });

  return normalized.slice(0, Math.max(limit, 1));
}
