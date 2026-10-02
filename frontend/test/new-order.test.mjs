import test from 'node:test';
import assert from 'node:assert/strict';
import { apiErrorMessage, emptyOrderForm, estimateOrder, formFromProduct, orderPayload, validateOrder, validateOrderPhoto } from '../src/Components/newOrderModel.js';

const valid = { ...emptyOrderForm, productName: ' Headphones ', productDescription: ' Black, sealed box ', productCategory: 'category-id', quantity: '2', country: 'KE', state: '30', city: ' Nairobi ', deliveryDate: '2026-10-20', productPrice: '14950', weight: '0.5', dimensions: ' 20 × 15 × 8 cm ' };

test('summary applies the current 15 percent fee to the full quantity', () => {
  assert.deepEqual(estimateOrder('14950', '2'), { subtotal: 29900, serviceFee: 4485, total: 34385 });
  assert.deepEqual(estimateOrder('0.10', '3'), { subtotal: 0.3, serviceFee: 0.05, total: 0.35 });
  for (const [price, quantity] of [['', 1], [-1, 1], [0.001, 1], [10.123, 1], ['Infinity', 2], [100, 0], [100, 1.5], [Number.MAX_VALUE, 2]]) assert.equal(estimateOrder(price, quantity), null);
});

test('creation validates descriptions, categories, quantities, prices, and real future dates', () => {
  assert.deepEqual(validateOrder(valid, { today: '2026-10-02' }), {});
  const errors = validateOrder({ ...valid, quantity: '1.5', productDescription: ' ', productCategory: 'custom', customCategory: '', country: '', productPrice: '-1', deliveryDate: '2026-02-30' }, { today: '2026-10-02' });
  for (const field of ['quantity', 'productDescription', 'customCategory', 'country', 'productPrice', 'deliveryDate']) assert.ok(errors[field]);
  assert.ok(validateOrder({ ...valid, deliveryDate: '2026-10-01' }, { today: '2026-10-02' }).deliveryDate);
});

test('payload preserves destination codes and uses the backend weight and dimensions fields', () => {
  const payload = orderPayload({ ...valid, photos: [{ base64: 'data:image/jpeg;base64,sample' }] });
  assert.equal(payload.productName, 'Headphones');
  assert.equal(payload.productDescription, 'Black, sealed box');
  assert.equal(payload.quantity, 2);
  assert.equal(payload.productFee, 14950);
  assert.equal(payload.productWeight, 0.5);
  assert.equal(payload.productDimensions, '20 × 15 × 8 cm');
  assert.deepEqual(payload.destination, { country: 'KE', state: '30', city: 'Nairobi' });
  assert.deepEqual(payload.productPhotos, ['data:image/jpeg;base64,sample']);
  assert.equal('weight' in payload, false);
  assert.equal('userId' in payload, false);
  assert.equal(orderPayload({ ...valid, productCategory: 'custom' }, 'created-category').productCategory, 'created-category');
});

test('edit hydration reads full product details and keeps the cart quantity authoritative', () => {
  const form = formFromProduct({ productName: 'Camera', productCategory: { _id: 'cat' }, productFee: 12000, quantity: 1, productPhotos: ['photo-url'], productWeight: 0.5, productDimensions: '12 cm', deliverydate: '2026-10-03T00:00:00.000Z', destination: { country: 'KE', state: '30', city: 'Nairobi' } }, { quantity: 3 });
  assert.equal(form.quantity, '3'); assert.equal(form.productCategory, 'cat');
  assert.equal(form.productPrice, '12000'); assert.equal(form.deliveryDate, '2026-10-03');
  assert.equal(form.photos[0].base64, 'photo-url'); assert.equal(form.weight, '0.5');
});

test('editing does not silently clear fields ignored by the existing update endpoint', () => {
  const original = { ...valid, deliveryDate: '2026-10-01', shippingRestrictions: 'Keep dry' };
  const errors = validateOrder({ ...original, weight: '', dimensions: '', shippingRestrictions: '' }, { today: '2026-10-02', original });
  for (const field of ['weight', 'dimensions', 'shippingRestrictions']) assert.ok(errors[field]);
  assert.equal(errors.deliveryDate, undefined);
});

test('photo validation rejects oversized, empty, and unsupported files', () => {
  assert.equal(validateOrderPhoto({ type: 'image/png', size: 5 * 1024 * 1024 }), '');
  for (const file of [{ type: 'image/png', size: 5 * 1024 * 1024 + 1 }, { type: 'image/jpeg', size: 0 }, { type: 'image/svg+xml', size: 50 }]) assert.ok(validateOrderPhoto(file));
});

test('API errors support both existing response envelope shapes', () => {
  assert.equal(apiErrorMessage({ response: { data: { data: 'Product already exists' } } }), 'Product already exists');
  assert.equal(apiErrorMessage({ response: { data: { data: { message: 'Category missing' } } } }), 'Category missing');
});
