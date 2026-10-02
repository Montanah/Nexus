import assert from 'node:assert/strict';
import test from 'node:test';
import { applyDeliveryConfirmation, formatDate, formatMoney, getItems, getOrderStatus, getProductId, matchesOrderFilter, searchOrder } from '../src/Components/clientDashboardModel.js';

const item = (id, status) => ({ product: { _id: id, productName: 'Travel bag' }, deliveryStatus: status });

test('item progress overrides stale order status after delivery updates', () => {
  const order = { deliveryStatus: 'Pending', items: [item('p1', 'Shipped')] };
  assert.equal(getOrderStatus(order), 'Shipped');
  assert.equal(matchesOrderFilter(order, 'active'), true);
  assert.equal(matchesOrderFilter(order, 'complete'), false);
});

test('orders needing client confirmation stay visible with mixed product stages', () => {
  const order = { items: [item('p1', 'Pending'), item('p2', 'Traveler Confirmed')] };
  assert.equal(matchesOrderFilter(order, 'confirm'), true);
  assert.equal(matchesOrderFilter(order, 'active'), true);
  assert.equal(matchesOrderFilter(order, 'complete'), false);
});

test('confirmation changes only the matching product and preserves order history', () => {
  const original = [{ _id: 'o1', items: [item('p1', 'Traveler Confirmed'), item('p2', 'Shipped')] }];
  const updated = applyDeliveryConfirmation(original, 'p1');
  assert.equal(original[0].items[0].deliveryStatus, 'Traveler Confirmed');
  assert.equal(updated[0].items[0].deliveryStatus, 'Client Confirmed');
  assert.equal(updated[0].items[1].deliveryStatus, 'Shipped');
  assert.equal(matchesOrderFilter(updated[0], 'confirm'), false);
  assert.equal(matchesOrderFilter(updated[0], 'active'), true);
});

test('receipt confirmation remains active until the traveler completes delivery', () => {
  const order = { items: [item('p1', 'Client Confirmed'), item('p2', 'Complete')] };
  assert.equal(getOrderStatus(order), 'Client Confirmed');
  assert.equal(matchesOrderFilter(order, 'complete'), false);
  assert.equal(matchesOrderFilter({ items: [item('p1', 'Complete'), item('p2', 'Delivered')] }, 'complete'), true);
});

test('cancelled orders and products do not inflate active or confirmation counts', () => {
  const cancelled = { deliveryStatus: 'Cancelled', items: [item('p1', 'Traveler Confirmed')] };
  assert.equal(matchesOrderFilter(cancelled, 'confirm'), false);
  assert.equal(matchesOrderFilter(cancelled, 'active'), false);
  assert.equal(getOrderStatus({ items: [item('p1', 'Cancelled')] }), 'Cancelled');
  assert.equal(matchesOrderFilter({ items: [item('p1', 'Complete'), item('p2', 'Cancelled')] }, 'complete'), true);
});

test('missing product details and dates remain usable instead of crashing', () => {
  const order = { orderNumber: 'ORD-123', items: [null, { product: null }] };
  assert.equal(getItems(order).length, 1);
  assert.equal(searchOrder(order, ' ord-123 '), true);
  assert.equal(searchOrder(order, 'missing'), false);
  assert.equal(formatDate(undefined), 'Not scheduled');
  assert.equal(formatDate('invalid'), 'Not scheduled');
  assert.equal(getProductId({ product: 'unpopulated-product-id' }), 'unpopulated-product-id');
  assert.equal(getProductId({ product: null }), '');
});

test('API numeric strings format as KES while missing amounts stay unknown', () => {
  assert.equal(formatMoney('14950'), formatMoney(14950));
  assert.match(formatMoney(0), /KES.*0/);
  for (const value of [null, undefined, '', 'not-a-number']) assert.equal(formatMoney(value), '—');
});
