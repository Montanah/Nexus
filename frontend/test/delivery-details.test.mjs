import assert from 'node:assert/strict';
import test from 'node:test';
import { claimAcknowledged, deliveryAction, deliveryContext, deliveryDestination, statusAcknowledged } from '../src/Components/deliveryDetailsModel.js';

const product = { _id: 'p1', productName: 'Camera', totalPrice: '12000', productMarkup: 1800, rewardAmount: '540', deliveryStatus: 'Pending', claimedBy: null };
test('direct delivery lookup requires membership in the current listings or own claimed deliveries', () => {
  assert.equal(deliveryContext([product], [], 'another'), null);
  assert.equal(deliveryContext([], [], 'p1'), null);
  assert.throws(() => deliveryContext(null, [], 'p1'));
  assert.equal(deliveryAction(deliveryContext([product], [], 'p1')), 'claim');
  const own = { ...product, deliveryStatus: 'Assigned', claimedBy: 'traveler-profile-id' };
  assert.equal(deliveryContext([product], [own], 'p1').owned, true);
  assert.equal(deliveryAction(deliveryContext([product], [own], 'p1')), 'ship');
});
test('unknown, already-claimed, delivered, and cancelled listings cannot be accepted', () => {
  for (const changes of [{ deliveryStatus: undefined }, { claimedBy: 'other-traveler' }, { isDelivered: true }, { deliveryStatus: 'Cancelled' }]) {
    assert.equal(deliveryAction(deliveryContext([{ ...product, ...changes }], [], 'p1')), '');
  }
});
test('owned delivery actions respect client confirmation and the proof acknowledgement', () => {
  const action = (status, extra = {}) => deliveryAction(deliveryContext([], [{ ...product, deliveryStatus: status, ...extra }], 'p1'));
  assert.equal(action('Assigned'), 'ship'); assert.equal(action('Shipped'), 'handover');
  assert.equal(action('Traveler Confirmed'), 'wait'); assert.equal(action('Client Confirmed'), 'proof');
  assert.equal(action('Client Confirmed', { proofUploaded: true }), 'finish');
  assert.equal(action('Complete'), 'rate'); assert.equal(action('Delivered'), ''); assert.equal(action('Cancelled'), '');
  assert.equal(deliveryAction({ owned: false, available: false, product: { ...product, deliveryStatus: 'Client Confirmed' } }), '');
});
test('claim and status responses must acknowledge the same item and expected action', () => {
  const claim = { success: true, data: { product: 'p1', travelerId: 't1' } };
  assert.equal(claimAcknowledged(claim, 'p1'), true);
  assert.equal(claimAcknowledged(claim, 'p2'), false);
  assert.equal(claimAcknowledged({ ...claim, success: false }, 'p1'), false);
  assert.equal(claimAcknowledged({ success: true, data: { product: 'p1' } }, 'p1'), false);
  const status = { success: true, data: { productId: 'p1', deliveryStatus: 'Shipped' } };
  assert.equal(statusAcknowledged(status, 'p1', 'Shipped'), true);
  assert.equal(statusAcknowledged(status, 'p1', 'Complete'), false);
  assert.equal(statusAcknowledged(status, 'p2', 'Shipped'), false);
  assert.equal(statusAcknowledged({}, 'p1', 'Shipped'), false);
});
test('missing item facts stay unknown and the reward is never replaced with markup', () => {
  const normalized = deliveryContext([product], [], 'p1').product;
  assert.equal(normalized.rewardAmount, 540); assert.equal(normalized.productPrice, 12000);
  const missing = deliveryContext([{ _id: 'p1' }], [], 'p1').product;
  assert.equal(missing.rewardAmount, null); assert.equal(missing.productPrice, null);
  assert.equal(missing.quantity, null); assert.equal(missing.productWeight, null); assert.equal(missing.urgencyLevel, '');
  assert.equal(missing.deliveryStatus, 'Unknown'); assert.deepEqual(missing.productPhotos, []);
  assert.equal(deliveryDestination(missing), 'Destination unavailable');
  assert.equal(deliveryDestination({ destination: { city: 'Nairobi', state: 'Nairobi', country: 'Kenya' } }), 'Nairobi, Kenya');
});
test('photo sources reject malformed arrays and executable or unsupported URLs', () => {
  const photos = ['https://example.test/photo.jpg', '/photo.png', 'javascript:alert(1)', 42, 'data:text/html;base64,AA==', 'data:image/png;base64,AA=='];
  assert.deepEqual(deliveryContext([{ ...product, productPhotos: photos }], [], 'p1').product.productPhotos, [photos[0], photos[1], photos[5]]);
});
