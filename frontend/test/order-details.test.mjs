import assert from 'node:assert/strict';
import test from 'node:test';
import { canConfirmReceipt, confirmOrderItem, deliveryStep, destinationLabel, orderItemDetails, receiptConfirmed, validateOrderDetails } from '../src/Components/orderDetailsModel.js';
import { getOrderStatus } from '../src/Components/clientDashboardModel.js';

const item = (id, status) => ({ product: { _id: id, productName: 'Travel bag', totalPrice: '1150' }, quantity: '2', claimedBy: 'traveler-private-id', deliveryStatus: status });
const mixed = () => ({ orderNumber: 'ORDER-123', totalAmount: 3450, deliveryStatus: 'Pending', items: [item('p1', 'Traveler Confirmed'), item('p2', 'Shipped')] });

test('receipt confirmation and completed delivery are separate stages', () => {
  assert.equal(deliveryStep('Traveler Confirmed'), 3);
  assert.equal(deliveryStep('Client Confirmed'), 4);
  assert.equal(deliveryStep('Complete'), 5);
  assert.equal(deliveryStep('Delivered'), 5);
  assert.equal(deliveryStep('Cancelled'), -1);
  assert.equal(deliveryStep('unrecognized'), -1);
});

test('only ready items with a product ID allow confirmation, even with stale order status', () => {
  const order = mixed();
  assert.equal(canConfirmReceipt(order, 'p1'), true);
  for (const id of ['p2', 'missing', '', null]) assert.equal(canConfirmReceipt(order, id), false);
  assert.equal(canConfirmReceipt({ ...order, deliveryStatus: 'Cancelled' }, 'p1'), false);
  assert.equal(canConfirmReceipt(undefined, 'p1'), false);
});

test('confirmation changes only the selected item without mutating history or finishing the order', () => {
  const original = mixed(), updated = confirmOrderItem(original, 'p1');
  assert.equal(original.items[0].deliveryStatus, 'Traveler Confirmed');
  assert.equal(updated.items[0].deliveryStatus, 'Client Confirmed');
  assert.equal(updated.items[1].deliveryStatus, 'Shipped');
  assert.equal(updated.totalAmount, 3450);
  assert.notEqual(getOrderStatus(updated), 'Complete');
  assert.equal(confirmOrderItem(updated, 'p1'), updated);
  assert.equal(confirmOrderItem(original, 'p2'), original);
});

test('successful confirmation must acknowledge the same product and the expected status', () => {
  const response = { success: true, data: { productId: 'p1', deliveryStatus: 'Client Confirmed' } };
  assert.equal(receiptConfirmed(response, 'p1'), true);
  assert.equal(receiptConfirmed(response, 'p2'), false);
  assert.equal(receiptConfirmed({ ...response, success: false }, 'p1'), false);
  assert.equal(receiptConfirmed({ success: true, data: { productId: 'p1', deliveryStatus: 'Complete' } }, 'p1'), false);
  assert.equal(receiptConfirmed(null, 'p1'), false);
});

test('missing or unpopulated products retain useful status without fabricated prices or names', () => {
  const missing = orderItemDetails({ product: null, quantity: null, deliveryStatus: 'Traveler Confirmed' }, {});
  assert.equal(missing.name, 'Product details unavailable');
  assert.equal(missing.quantity, null);
  assert.equal(missing.unitTotal, null);
  assert.equal(missing.canConfirm, false);
  assert.equal(missing.destination, 'Destination unavailable');
  const unpopulated = orderItemDetails({ product: 'p1', claimedBy: 'private-traveler-id', quantity: '2', deliveryStatus: 'Shipped' }, {});
  assert.equal(unpopulated.traveler, 'Traveler assigned');
  assert.equal(unpopulated.travelerNamed, false);
  assert.equal(unpopulated.quantity, 2);
  assert.equal(unpopulated.unitTotal, null);
});

test('API amounts are already fee-inclusive and cancellation overrides item actions', () => {
  const order = mixed(), details = orderItemDetails(order.items[0], order);
  assert.equal(details.unitTotal, 1150);
  const cancelled = orderItemDetails(order.items[0], { ...order, deliveryStatus: 'Cancelled' });
  assert.equal(cancelled.status, 'Cancelled');
  assert.equal(cancelled.canConfirm, false);
  assert.equal(cancelled.canRate, false);
  for (const quantity of [0, -1, 1.5, 'unknown']) assert.equal(orderItemDetails({ quantity }, {}).quantity, null);
});

test('traveler rating follows accepted backend stages and requires an unrated assigned product', () => {
  for (const status of ['Client Confirmed', 'Delivered']) assert.equal(orderItemDetails(item('p1', status), {}).canRate, true);
  for (const status of ['Pending', 'Shipped', 'Traveler Confirmed', 'Complete']) assert.equal(orderItemDetails(item('p1', status), {}).canRate, false);
  assert.equal(orderItemDetails({ ...item('p1', 'Delivered'), travelerRating: 5 }, {}).canRate, false);
  assert.equal(orderItemDetails({ ...item('p1', 'Delivered'), claimedBy: null }, {}).canRate, false);
});

test('order lookup rejects another order and filters missing item entries', () => {
  assert.throws(() => validateOrderDetails(mixed(), 'OTHER-ORDER'));
  assert.throws(() => validateOrderDetails(null, 'ORDER-123'));
  assert.deepEqual(validateOrderDetails({ ...mixed(), items: [null, item('p1', 'Pending')] }, 'ORDER-123').items, [item('p1', 'Pending')]);
  assert.equal(destinationLabel({ city: 'Nairobi', country: 'KE' }), 'Nairobi, Kenya');
  assert.equal(destinationLabel({ country: 'Kenya' }), 'Kenya');
  assert.equal(destinationLabel(null), 'Destination unavailable');
});
