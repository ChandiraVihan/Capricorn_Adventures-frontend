import assert from 'node:assert/strict';
import {
  createRoomServiceToast,
  getRoomServiceNextStatuses,
  mapRoomServiceStreamEventToOrders,
  upsertRoomServiceOrder,
} from '../src/state/roomServiceState.js';

const initialOrders = [
  {
    orderId: 2,
    roomNumber: 204,
    floorNumber: 2,
    itemsOrdered: ['Tea'],
    placedAt: '2026-04-25T09:00:00',
    assignedStaffId: null,
    assignedStaffName: null,
    status: 'RECEIVED',
    staleFlag: false,
    lastStatusUpdatedAt: '2026-04-25T09:00:00',
  },
];

const updatedOrders = upsertRoomServiceOrder(initialOrders, {
  orderId: 2,
  roomNumber: 204,
  floorNumber: 2,
  itemsOrdered: ['Tea', 'Sandwich'],
  placedAt: '2026-04-25T09:00:00',
  assignedStaffId: 'staff-1',
  assignedStaffName: 'Ravi',
  status: 'PREPARING',
  staleFlag: true,
  lastStatusUpdatedAt: '2026-04-25T09:05:00',
});

assert.equal(updatedOrders.length, 1, 'upsert should keep one order per id');
assert.equal(updatedOrders[0].assignedStaffName, 'Ravi', 'upsert should keep newest order data');
assert.equal(updatedOrders[0].staleFlag, true, 'upsert should preserve stale flag');
assert.deepEqual(getRoomServiceNextStatuses('RECEIVED'), ['PREPARING']);
assert.deepEqual(getRoomServiceNextStatuses('PREPARING'), ['DELIVERED']);
assert.deepEqual(getRoomServiceNextStatuses('DELIVERED'), []);

const eventToast = createRoomServiceToast({
  eventType: 'ORDER_STALE_ALERT',
  message: 'Order 204 is stale.',
  occurredAt: '2026-04-25T09:10:00',
  order: { orderId: 2 },
});

assert.equal(eventToast.type, 'warning');
assert.equal(eventToast.orderId, 2);

const mapped = mapRoomServiceStreamEventToOrders(updatedOrders, {
  eventType: 'ORDER_STATUS_UPDATED',
  order: {
    orderId: 2,
    roomNumber: 204,
    floorNumber: 2,
    itemsOrdered: ['Tea', 'Sandwich'],
    placedAt: '2026-04-25T09:00:00',
    assignedStaffId: 'staff-1',
    assignedStaffName: 'Ravi',
    status: 'DELIVERED',
    staleFlag: false,
    lastStatusUpdatedAt: '2026-04-25T09:15:00',
  },
});

assert.equal(mapped[0].status, 'DELIVERED');
console.log('roomServiceState tests passed');
