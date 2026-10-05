import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assignment,
  clientInfo,
  itemQuantity,
  itemStage,
  lookupIndexes,
  orderItems,
  ordersPath,
  paymentStatus,
  productDestination,
  productInfo,
  proofUrl,
  readOrderDetails,
  readOrdersQuery,
  referenceId,
  safeOrdersReturn,
  selectOrders,
  travelerInfo,
} from '../src/components/ordersModel.js';
import { loadedResource, orderStage } from '../src/components/overviewModel.js';
const resources = {
  users: loadedResource([
    { _id: 'client-a', name: 'Amara Client' },
    { _id: 'account-a', name: 'Nia Traveler' },
    { _id: 'account-b', name: 'Leo Traveler' },
  ]),
  travelers: loadedResource([
    { _id: 'traveler-a', userId: 'account-a' },
    { _id: 'traveler-b', userId: { _id: 'account-b' } },
  ]),
  products: loadedResource([
    { _id: 'product-a', productName: 'Headphones', quantity: 99 },
  ]),
};
const order = {
  _id: 'order-a',
  orderNumber: 'ORD-20261005-1001',
  userId: 'client-a',
  createdAt: '2026-10-01T12:00:00Z',
  deliveryStatus: 'Pending',
  paymentStatus: 'Paid',
  items: [
    {
      product: 'product-a',
      quantity: 2,
      claimedBy: 'traveler-a',
      deliveryStatus: 'Complete',
    },
    {
      product: { _id: 'product-a' },
      quantity: 1,
      claimedBy: 'traveler-b',
      deliveryStatus: 'Shipped',
    },
  ],
};
const query = (change) => ({
  ...readOrdersQuery(new URLSearchParams()),
  ...change,
});
test('client lookup uses Users directly; traveler lookup uses Traveler then Users', () => {
  const indexes = lookupIndexes(resources);
  assert.equal(clientInfo(order, resources, indexes).name, 'Amara Client');
  assert.equal(
    travelerInfo(order.items[0], resources, indexes).name,
    'Nia Traveler',
  );
  assert.equal(
    travelerInfo(order.items[1], resources, indexes).name,
    'Leo Traveler',
  );
  assert.equal(referenceId({ _id: 'abc' }), 'abc');
});
test('client and traveler filters can combine without confusing their IDs', () => {
  assert.equal(
    selectOrders(
      [order],
      query({ client: 'amara', traveler: 'leo' }),
      resources,
    ).total,
    1,
  );
  assert.equal(
    selectOrders([order], query({ client: 'nia' }), resources).total,
    0,
  );
  assert.equal(
    selectOrders([order], query({ traveler: 'client-a' }), resources).total,
    0,
  );
  assert.equal(
    selectOrders([order], query({ traveler: 'traveler-b' }), resources).total,
    1,
  );
});
test('general search covers references, products, names, and IDs and returns one row per order', () => {
  for (const search of [
    'HEADPHONES',
    'order-a',
    'ORD-20261005',
    'Nia',
    'product-a',
  ])
    assert.equal(
      selectOrders([order], query({ search }), resources).rows.length,
      1,
    );
  assert.equal(
    selectOrders([order], query({ search: 'unavailable' }), resources).total,
    0,
  );
});
test('restricted lookup resources discard even accidentally retained records', () => {
  const restricted = Object.fromEntries(
    Object.entries(resources).map(([key, value]) => [
      key,
      { ...value, status: 'restricted' },
    ]),
  );
  const indexes = lookupIndexes(restricted);
  assert.match(clientInfo(order, restricted, indexes).name, /restricted/);
  assert.match(
    travelerInfo(order.items[0], restricted, indexes).name,
    /restricted/,
  );
  assert.match(
    productInfo(order.items[0], restricted, indexes).name,
    /restricted/,
  );
  assert.equal(
    selectOrders([order], query({ search: 'Amara' }), restricted).total,
    0,
  );
  assert.equal(
    selectOrders([order], query({ search: 'client-a' }), restricted).total,
    1,
  );
});
test('failed lookup refreshes retain searchable known names, while missing records stay unavailable', () => {
  const stale = {
    ...resources,
    users: { ...resources.users, status: 'error' },
  };
  assert.equal(
    selectOrders([order], query({ client: 'Amara' }), stale).total,
    1,
  );
  assert.match(
    clientInfo({ userId: 'missing' }, resources, lookupIndexes(resources)).name,
    /unavailable/,
  );
});
test('assignment distinguishes explicit null, missing assignment, and multiple travelers', () => {
  assert.equal(assignment(order), 'Assigned');
  assert.equal(
    assignment({ items: [{ claimedBy: null }, { claimedBy: null }] }),
    'Unassigned',
  );
  assert.equal(
    assignment({ items: [{ claimedBy: null }, { claimedBy: 'traveler-a' }] }),
    'Mixed',
  );
  for (const items of [undefined, [], [null], [{}], [{ claimedBy: {} }]])
    assert.equal(assignment({ items }), 'Unknown');
  assert.equal(
    travelerInfo({ claimedBy: null }, resources, lookupIndexes(resources)).name,
    'Unassigned',
  );
  assert.equal(
    travelerInfo({}, resources, lookupIndexes(resources)).name,
    'Assignment unavailable',
  );
});
test('aggregate delivery stages stay consistent with the overview and separate from payment status', () => {
  assert.equal(orderStage(order), 'In progress');
  assert.equal(
    selectOrders(
      [order],
      query({ stage: 'In progress', payment: 'Paid' }),
      resources,
    ).total,
    1,
  );
  assert.equal(
    selectOrders([order], query({ stage: 'Complete' }), resources).total,
    0,
  );
  assert.equal(
    selectOrders([order], query({ payment: 'Pending' }), resources).total,
    0,
  );
  assert.equal(paymentStatus({ paymentStatus: 'completed' }), 'Unknown');
  assert.equal(
    itemStage({ deliveryStatus: 'CLient Confirmed' }),
    'Client Confirmed',
  );
  assert.equal(itemStage({ deliveryStatus: 'future' }), 'Unknown');
});
test('item quantities use the order item, not the current product listing quantity', () => {
  assert.equal(itemQuantity(order.items[0]), '2');
  assert.equal(
    productInfo(order.items[0], resources, lookupIndexes(resources)).record
      .quantity,
    99,
  );
  for (const quantity of [undefined, null, '2', 0, -1, 1.5])
    assert.equal(itemQuantity({ quantity }), 'Unavailable');
});
test('empty items are distinct from missing or malformed item arrays', () => {
  assert.deepEqual(orderItems({ items: [] }), []);
  for (const items of [undefined, null, {}, [null], ['item']])
    assert.equal(orderItems({ items }), null);
  assert.equal(
    productDestination({ destination: { city: 'Nairobi', country: 'Kenya' } }),
    'Nairobi, Kenya',
  );
  assert.equal(productDestination(null), 'Unavailable');
});
test('dates sort in either direction with missing dates last and stable pagination', () => {
  const orders = Array.from({ length: 12 }, (_, i) => ({
    ...order,
    _id: `id-${i}`,
    createdAt:
      i === 11
        ? undefined
        : `2026-09-${String(i + 1).padStart(2, '0')}T12:00:00Z`,
  }));
  assert.equal(selectOrders(orders, query(), resources).rows[0]._id, 'id-10');
  const last = selectOrders(
    orders,
    query({ sort: 'oldest', page: 99 }),
    resources,
  );
  assert.equal(last.page, 2);
  assert.equal(last.rows.at(-1)._id, 'id-11');
  assert.equal(last.start, 11);
  assert.equal(last.end, 12);
  assert.equal(orders[0]._id, 'id-0');
  assert.equal(selectOrders([], query({ page: 99 }), resources).start, 0);
});
test('query and return links preserve validated filters and reject external destinations', () => {
  const state = query({
    search: 'Order & parcel',
    client: 'Amara',
    traveler: 'Nia',
    stage: 'In progress',
    payment: 'Paid',
    assignment: 'Mixed',
    sort: 'oldest',
    page: 2,
  });
  const path = ordersPath(state);
  assert.deepEqual(
    readOrdersQuery(new URLSearchParams(path.split('?')[1])),
    state,
  );
  assert.equal(safeOrdersReturn(path), path);
  for (const value of [
    'https://example.test',
    '//example.test',
    '/orders/other',
    '/users',
    undefined,
  ])
    assert.equal(safeOrdersReturn(value), '/orders');
  const invalid = readOrdersQuery(
    new URLSearchParams(
      'stage=nope&payment=refunded&assignment=bad&sort=amount&page=1.2',
    ),
  );
  assert.equal(invalid.stage, 'all');
  assert.equal(invalid.payment, 'all');
  assert.equal(invalid.assignment, 'all');
  assert.equal(invalid.sort, 'newest');
  assert.equal(invalid.page, 1);
});
test('detail responses must acknowledge the requested order; missing items remain visible as unavailable', () => {
  assert.equal(readOrderDetails({ data: { order } }, order._id), order);
  for (const payload of [
    {},
    { data: {} },
    { data: { order: { ...order, _id: 'other' } } },
    { success: false, data: { order } },
  ])
    assert.throws(() => readOrderDetails(payload, order._id));
  assert.throws(() => readOrderDetails({ data: { order: {} } }, undefined));
  assert.equal(
    orderItems(readOrderDetails({ data: { order: { _id: 'abc' } } }, 'abc')),
    null,
  );
});
test('proof links only expose HTTPS URLs without embedded credentials', () => {
  assert.equal(
    proofUrl('https://example.test/proof.jpg'),
    'https://example.test/proof.jpg',
  );
  for (const value of [
    'javascript:alert(1)',
    'data:image/png;base64,a',
    'http://example.test/a',
    'https://user:password@example.test/a',
    '/local-file',
    null,
    {},
  ])
    assert.equal(proofUrl(value), null);
});
