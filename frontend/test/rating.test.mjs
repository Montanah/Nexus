import assert from 'node:assert/strict';
import test from 'node:test';
import { clientRatingContext, isAlreadyRated, ratingError, ratingPayload, ratingSaved, resolveRatingRole, travelerRatingContext, validateRating } from '../src/Components/ratingModel.js';
const order = status => ({ orderNumber: 'ORDER-1', deliveryStatus: 'Pending', items: [{ product: { _id: 'p1', productName: 'Headphones', productPhotos: [] }, claimedBy: { userId: { name: 'Sam Taylor' } }, deliveryStatus: status }] });

test('rating roles survive direct links and do not silently default to client', () => {
  assert.equal(resolveRatingRole('?as=traveler', null, { role: 'user' }), 'traveler');
  assert.equal(resolveRatingRole('?as=client', { isTraveler: true }, { role: 'traveler' }), 'client');
  assert.equal(resolveRatingRole('', { isTraveler: false }, null), 'client');
  assert.equal(resolveRatingRole('', null, { role: 'traveler' }), 'traveler');
  assert.equal(resolveRatingRole('', null, { role: 'user' }), '');
  assert.equal(resolveRatingRole('?as=invalid', null, { role: 'traveler' }), '');
});

test('client ratings use the selected item and current endpoint eligibility', () => {
  for (const status of ['Client Confirmed', 'Delivered']) assert.equal(clientRatingContext([order(status)], 'p1').eligible, true);
  for (const status of ['Pending', 'Traveler Confirmed', 'Complete', 'Cancelled']) assert.equal(clientRatingContext([order(status)], 'p1').eligible, false);
  assert.equal(clientRatingContext([{ ...order('Client Confirmed'), deliveryStatus: 'Cancelled' }], 'p1').eligible, false);
  const data = order('Delivered'); data.items[0].claimedBy = null;
  assert.equal(clientRatingContext([data], 'p1').eligible, false);
  assert.equal(clientRatingContext([order('Delivered')], 'another-product'), null);
  assert.equal(clientRatingContext([order('Delivered')], ''), null);
});

test('existing ratings are read from order items and retained with their comments', () => {
  const data = order('Client Confirmed');
  data.items[0].travelerRating = 4; data.items[0].travelerComment = 'A helpful handover.';
  const context = clientRatingContext([data], 'p1');
  assert.equal(context.existingRating, 4); assert.equal(context.existingComment, 'A helpful handover.');
  assert.equal(context.person, 'Sam Taylor'); assert.equal(context.name, 'Headphones');
});

test('missing display data never exposes database IDs as names or invents a review', () => {
  const data = order('Delivered'); data.items[0].product = 'p1'; data.items[0].claimedBy = 'traveler-id';
  const context = clientRatingContext([null, data], 'p1');
  assert.equal(context.person, 'Your traveler'); assert.equal(context.name, 'Product details unavailable');
  assert.equal(context.existingRating, undefined);
  assert.equal(clientRatingContext([{ items: [null, { product: null }] }], 'p1'), null);
  assert.throws(() => clientRatingContext({}, 'p1'));
});

test('traveler ratings require a matching completed claimed delivery', () => {
  const product = { _id: 'p1', client: 'private-client-id', deliveryStatus: 'Complete' };
  assert.equal(travelerRatingContext([product], 'p1').eligible, true);
  assert.equal(travelerRatingContext([product], 'p1').person, 'Your client');
  for (const status of ['Delivered', 'Client Confirmed', 'Shipped', 'Pending']) assert.equal(travelerRatingContext([{ ...product, deliveryStatus: status }], 'p1').eligible, false);
  assert.equal(travelerRatingContext([product], 'another-product'), null);
  assert.throws(() => travelerRatingContext(null, 'p1'));
});

test('ratings require integer stars and comments within the 500 character limit', () => {
  for (const stars of [0, 6, -1, 2.5, '5', null]) assert.equal(validateRating(stars, '')?.field, 'rating');
  for (const stars of [1, 2, 3, 4, 5]) assert.equal(validateRating(stars, 'a'.repeat(500)), null);
  assert.equal(validateRating(4, 'a'.repeat(501))?.field, 'comment');
  assert.equal(validateRating(4, null)?.field, 'comment');
  assert.deepEqual(ratingPayload('p1', 4, '  Clear communication.  '), { productId: 'p1', rating: 4, comment: 'Clear communication.' });
});

test('success requires an acknowledged rating for the intended recipient', () => {
  const response = { success: true, data: { travelerRating: { average: 4.5, count: 2 } } };
  assert.equal(ratingSaved(response, 'client'), true);
  assert.equal(ratingSaved(response, 'traveler'), false);
  assert.equal(ratingSaved({ ...response, success: false }, 'client'), false);
  assert.equal(ratingSaved({ success: true, data: { travelerRating: { average: 4.5, count: 0 } } }, 'client'), false);
  assert.equal(ratingSaved({ success: true, data: { clientRating: { average: 5, count: 1 } } }, 'traveler'), true);
  assert.equal(ratingSaved(null, 'client'), false);
});

test('duplicate and failed saves remain distinct from newly saved feedback', () => {
  const duplicate = { response: { status: 400, data: { data: { message: 'Client already rated for this product' } } } };
  assert.equal(isAlreadyRated(duplicate), true);
  assert.equal(isAlreadyRated({ message: 'Server error' }), false);
  assert.equal(ratingError({ response: { status: 400, data: { data: { message: 'No traveler assigned to this product' } } } }), 'No traveler assigned to this product');
  assert.match(ratingError({ response: { status: 500, data: { message: 'Internal database error' } } }), /couldn’t confirm/);
});
