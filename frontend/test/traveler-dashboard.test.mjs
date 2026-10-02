import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyFilters, filterProducts, isAvailable, matchesDelivery, nextStatus, normalizeProducts, validateProofFile } from '../src/Components/travelerDashboardModel.js';

test('rewards come from the traveler reward, never from the full markup', () => {
  const [product, unknown] = normalizeProducts([{ _id: 'a', totalPrice: '5000', productMarkup: 750, rewardAmount: '225', urgencyLevel: 'HIGH' }, { _id: 'b', productMarkup: 750 }]);
  assert.equal(product.rewardAmount, 225);
  assert.equal(product.productPrice, 5000);
  assert.equal(product.urgencyLevel, 'high');
  assert.equal(unknown.rewardAmount, null);
  assert.equal(unknown.productPrice, null);
  assert.deepEqual(normalizeProducts([null, 'deleted', {}]), []);
});

test('destination, urgency, category, and numeric price filters combine without mutating the source', () => {
  const products = normalizeProducts([
    { _id: 'a', productName: 'Camera', categoryName: 'Electronics', destination: { country: 'Kenya', state: 'Nairobi', city: 'Nairobi' }, urgencyLevel: 'HIGH', totalPrice: '15000', rewardAmount: 500 },
    { _id: 'b', productName: 'Camera bag', categoryName: 'Accessories', destination: { country: 'Uganda', city: 'Kampala' }, totalPrice: 6000, rewardAmount: 800 },
    { _id: 'c', productName: 'Camera case', rewardAmount: 200 },
  ]);
  const filters = { ...emptyFilters, country: 'Kenya', state: 'Nairobi', city: 'Nairobi', category: 'Electronics', urgency: 'high', priceMin: '10000', priceMax: '20000' };
  assert.deepEqual(filterProducts(products, { query: ' CAMERA ', filters }).map(p => p.productId), ['a']);
  assert.deepEqual(filterProducts(products, { sort: 'reward' }).map(p => p.productId), ['b', 'a', 'c']);
  assert.deepEqual(filterProducts(products, { filters: { ...emptyFilters, priceMin: '0' } }).map(p => p.productId), ['a', 'b']);
  assert.deepEqual(products.map(p => p.productId), ['a', 'b', 'c']);
});

test('unknown dates sort last and nearest deadlines sort first', () => {
  const products = normalizeProducts([{ _id: 'missing' }, { _id: 'later', deliverydate: '2026-10-12' }, { _id: 'soon', deliverydate: '2026-10-03' }]);
  assert.deepEqual(filterProducts(products).map(p => p.productId), ['soon', 'later', 'missing']);
});

test('only unclaimed pending products are available', () => {
  assert.equal(isAvailable({ deliveryStatus: 'Pending', claimedBy: null }), true);
  for (const product of [{ deliveryStatus: 'Cancelled' }, { deliveryStatus: 'Complete' }, { deliveryStatus: 'Pending', claimedBy: 'someone' }]) assert.equal(isAvailable(product), false);
});

test('traveler actions cannot bypass client confirmation or proof submission', () => {
  assert.equal(nextStatus({ deliveryStatus: 'Assigned' }), 'Shipped');
  assert.equal(nextStatus({ deliveryStatus: 'Shipped' }), 'Traveler Confirmed');
  for (const status of ['Pending', 'Traveler Confirmed', 'Client Confirmed', 'Complete', 'Cancelled']) assert.equal(nextStatus({ deliveryStatus: status }), null);
  assert.equal(nextStatus({ deliveryStatus: 'Client Confirmed', proofUploaded: true }), 'Complete');
});

test('proof-needed deliveries remain active; completed and cancelled deliveries do not', () => {
  assert.equal(matchesDelivery({ deliveryStatus: 'Client Confirmed' }, 'active'), true);
  assert.equal(matchesDelivery({ deliveryStatus: 'Client Confirmed' }, 'proof'), true);
  assert.equal(matchesDelivery({ deliveryStatus: 'Complete' }, 'complete'), true);
  assert.equal(matchesDelivery({ deliveryStatus: 'Cancelled' }, 'active'), false);
  assert.equal(matchesDelivery({ deliveryStatus: 'Complete' }, 'proof'), false);
});

test('proof validation allows supported files only, up to the backend 5 MB limit', () => {
  assert.match(validateProofFile(null), /Choose/);
  assert.match(validateProofFile({ type: 'image/svg+xml', size: 100 }), /JPG, PNG, or PDF/);
  assert.match(validateProofFile({ type: 'image/png', size: 0 }), /empty/);
  assert.match(validateProofFile({ type: 'image/png', size: 5 * 1024 * 1024 + 1 }), /5 MB/);
  for (const type of ['image/jpeg', 'image/png', 'application/pdf']) assert.equal(validateProofFile({ type, size: 5 * 1024 * 1024 }), '');
});
