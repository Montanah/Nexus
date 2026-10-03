import test from 'node:test';
import assert from 'node:assert/strict';
import { paymentReference, resultOrder, verifiedPayment } from '../src/Components/paymentResultModel.js';

const response = (status, extra = {}) => ({ success: true, data: { success: true, status, orderNumber: 'ORDER-123', amount: 230000, ...extra } });

test('confirmation follows the nested provider status, not HTTP success or order status', () => {
  assert.equal(verifiedPayment(response('success'), 'ref').status, 'success');
  for (const status of ['failed', 'abandoned']) assert.equal(verifiedPayment(response(status), 'ref').status, 'failed');
  for (const status of ['pending', 'processing', 'ongoing', 'queued']) assert.equal(verifiedPayment(response(status), 'ref').status, 'pending');
  for (const status of ['Paid', 'unexpected', undefined]) assert.equal(verifiedPayment(response(status), 'ref').status, 'unconfirmed');
  assert.throws(() => verifiedPayment({ success: true }, 'ref'));
  assert.throws(() => verifiedPayment({ ...response('success'), success: false }, 'ref'));
  assert.throws(() => verifiedPayment(response('success', { orderNumber: '' }), 'ref'));
  assert.throws(() => verifiedPayment(response('success', { success: false }), 'ref'));
});

test('amounts convert minor units exactly and missing values never become a zero receipt', () => {
  assert.deepEqual(verifiedPayment(response('success', { amount: '3053250' }), 'reference'), { status: 'success', method: 'Paystack', reference: 'reference', orderNumber: 'ORDER-123', amount: 30532.5 });
  for (const amount of [null, undefined, '', ' ', 'wrong', -100, Infinity, 0, 12.5]) assert.equal(verifiedPayment(response('success', { amount }), 'ref').amount, null);
});

test('callback reference survives reload without fabricating one or accepting control characters', () => {
  assert.equal(paymentReference('?reference=provider_123'), 'provider_123');
  assert.equal(paymentReference('?trxref=provider-456'), 'provider-456');
  assert.equal(paymentReference('?reference=abc%2Fdef'), 'abc/def');
  for (const query of ['', '?session_id=cs_example', '?reference=', '?reference=x%00x', `?reference=${'x'.repeat(201)}`]) assert.equal(paymentReference(query), '');
});

test('order details must match the verified order and never invent a date', () => {
  assert.throws(() => resultOrder({ orderNumber: 'OTHER' }, 'ORDER-123'));
  assert.deepEqual(resultOrder({ orderNumber: 'ORDER-123', createdAt: 'bad date' }, 'ORDER-123'), { createdAt: null, items: [] });
  const order = resultOrder({ orderNumber: 'ORDER-123', createdAt: '2026-10-03T12:00:00Z', paymentStatus: 'Paid', items: [{ _id: 'item-1', product: { productName: 'Headphones' }, quantity: '2' }, { product: null, quantity: 0 }, null] }, 'ORDER-123');
  assert.equal(order.createdAt, '2026-10-03T12:00:00Z'); assert.equal(order.items.length, 2);
  assert.equal(order.items[0].quantity, 2); assert.equal(order.items[1].name, 'Product details unavailable'); assert.equal(order.items[1].quantity, null);
  assert.equal(order.paymentStatus, undefined, 'order status cannot override provider verification');
});
