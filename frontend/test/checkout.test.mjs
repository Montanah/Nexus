import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCart } from '../src/Components/cartModel.js';
import { checkoutPayload, checkoutResult, normalizePaymentPhone, validateCheckout } from '../src/Components/checkoutModel.js';

const items = normalizeCart([{ productId: 'camera', quantity: '2', productFee: '1000', finalCharge: '2300' }]);
const mobile = { method: 'mpesa', phone: '0712 345 678', email: '' };

test('mobile numbers normalize consistently without accepting arbitrary text or foreign numbers', () => {
  for (const phone of ['0712 345 678', '+254 712 345 678', '712345678', '254712345678']) assert.equal(normalizePaymentPhone(phone), '254712345678');
  assert.equal(normalizePaymentPhone('0112345678'), '254112345678');
  for (const phone of ['', 'abc0712345678', '+1 415 555 1234', '071234567', '254254712345678']) assert.equal(normalizePaymentPhone(phone), '');
});

test('checkout requires valid cart details and an available payment method', () => {
  assert.deepEqual(validateCheckout(mobile, items), {});
  assert.ok(validateCheckout({ ...mobile, method: '' }, items).method);
  for (const method of ['card', 'paypal', 'unrecognized']) assert.ok(validateCheckout({ ...mobile, method }, items).method);
  assert.ok(validateCheckout(mobile, []).cart);
  assert.ok(validateCheckout(mobile, normalizeCart([{ productId: null, quantity: 1, productFee: 100, finalCharge: 115 }])).cart);
  assert.ok(validateCheckout({ ...mobile, phone: '123' }, items).phone);
});

test('Paystack validates email and prevents the existing backend from truncating cents', () => {
  const form = { method: 'paystack', email: 'client@example.test', phone: '' };
  assert.deepEqual(validateCheckout(form, items), {});
  assert.ok(validateCheckout({ ...form, email: 'invalid' }, items).email);
  const fractional = normalizeCart([{ productId: 'book', quantity: 1, productFee: 10, finalCharge: 11.5 }]);
  assert.ok(validateCheckout(form, fractional).method);
  assert.throws(() => checkoutPayload(form, fractional, 'client'));
});

test('payment payload uses the confirmed cart amount once and sends only required details', () => {
  assert.deepEqual(checkoutPayload(mobile, items, 'client'), { userId: 'client', paymentMethod: 'Mpesa', amount: 2300, phoneNumber: '254712345678', cartItems: [{ productId: 'camera', quantity: 2, productFee: 1000 }] });
  const hosted = checkoutPayload({ method: 'paystack', email: ' client@example.test ', phone: '0712345678' }, items, 'client');
  assert.equal(hosted.email, 'client@example.test'); assert.equal(hosted.phoneNumber, undefined);
  assert.equal(hosted.paymentMethodId, undefined); assert.equal(hosted.voucherCode, undefined);
  assert.throws(() => checkoutPayload(mobile, items, null));
});

test('mobile initiation remains pending even when the current endpoint reports Paid', () => {
  const response = { success: true, data: { success: true, status: 'Paid', orderNumber: 'ORDER-123', transactionId: 'provider-123' } };
  for (const method of ['mpesa', 'airtel']) assert.deepEqual(checkoutResult(response, method), { kind: 'pending', orderNumber: 'ORDER-123' });
  assert.throws(() => checkoutResult({ success: true }, 'mpesa'));
  assert.throws(() => checkoutResult({ ...response, success: false }, 'mpesa'));
});

test('hosted payment requires a complete response and an HTTPS checkout link', () => {
  const response = url => ({ success: true, data: { success: true, orderNumber: 'ORDER-123', transactionId: 'provider-123', authorizationUrl: url } });
  assert.deepEqual(checkoutResult(response('https://checkout.example.test/session'), 'paystack'), { kind: 'redirect', orderNumber: 'ORDER-123', url: 'https://checkout.example.test/session' });
  for (const url of ['', 'javascript:alert(1)', 'http://checkout.example.test', 'https://user:password@checkout.example.test']) assert.throws(() => checkoutResult(response(url), 'paystack'));
});
