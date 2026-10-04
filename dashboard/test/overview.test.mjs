import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canRead,
  canVisit,
  initialResources,
  readCollection,
  loadedResource,
  failedResource,
  resourceCount,
  countLabel,
  resourceCaption,
  orderStage,
  stageCounts,
  recentOrders,
  orderDate,
  sectionForPath,
} from '../src/components/overviewModel.js';

const admin = { permissions: ['all'], role: 'superadmin' };
test('collection totals require actual arrays; empty arrays are a valid zero', () => {
  assert.deepEqual(readCollection({ data: { users: [] } }, 'users'), []);
  for (const payload of [
    {},
    { data: {} },
    { data: { users: null } },
    { data: { users: {} } },
    { success: false, data: { users: [] } },
  ]) {
    assert.throws(() => readCollection(payload, 'users'));
  }
});
test('invalid records fail visibly rather than crashing the overview or becoming zero', () => {
  for (const record of [null, 3, [], {}, { _id: '' }, { _id: 123 }])
    assert.throws(() =>
      readCollection({ data: { orders: [record] } }, 'orders'),
    );
  const records = [{ _id: 'order-a' }];
  assert.equal(
    readCollection({ data: { orders: records } }, 'orders'),
    records,
  );
});
test('both documented and legacy traveler envelopes are accepted', () => {
  const travelers = [{ _id: 'traveler-a' }];
  assert.equal(readCollection({ data: { travelers } }, 'travelers'), travelers);
  assert.equal(readCollection({ data: travelers }, 'travelers'), travelers);
});
test('read access matches the server and does not infer it from write access or role', () => {
  assert.equal(canRead(admin, 'orders'), true);
  assert.equal(canRead({ permissions: ['orders.read'] }, 'orders'), true);
  for (const account of [
    null,
    {},
    { permissions: ['orders'] },
    { permissions: ['orders.write'] },
    { role: 'superadmin', permissions: [] },
  ])
    assert.equal(canRead(account, 'orders'), false);
});
test('admin management uses the server role requirement', () => {
  assert.equal(canVisit(admin, 'admins'), true);
  assert.equal(
    canVisit({ role: 'admin', permissions: ['all'] }, 'admins'),
    false,
  );
  assert.equal(canVisit({ permissions: [] }, 'profile'), true);
  assert.equal(canVisit({ permissions: [] }, 'overview'), true);
});
test('initial loading and restricted resources are unknown, not zero', () => {
  const resources = initialResources({ permissions: ['orders.read'] });
  assert.equal(resources.orders.status, 'loading');
  assert.equal(resources.users.status, 'restricted');
  assert.equal(resourceCount(resources.orders), null);
  assert.equal(countLabel(resources.users), '—');
  assert.equal(countLabel(loadedResource([])), '0');
});
test('initial failures stay unknown and refresh failures preserve the last successful snapshot', () => {
  const failed = failedResource(
    initialResources(admin).users,
    new Error('network'),
  );
  assert.equal(resourceCount(failed), null);
  const before = loadedResource([{ _id: 'user-a' }], 1234);
  const after = failedResource(before, new Error('network'));
  assert.equal(after.data, before.data);
  assert.equal(after.updatedAt, 1234);
  assert.equal(after.status, 'error');
  assert.match(resourceCaption(after), /Last loaded/);
});
test('revoked access clears previously loaded data and timestamps', () => {
  const resource = failedResource(loadedResource([{ _id: 'order-a' }], 1234), {
    response: { status: 403 },
  });
  assert.equal(resource.status, 'restricted');
  assert.equal(resource.data, null);
  assert.equal(resource.updatedAt, null);
  assert.equal(countLabel(resource), '—');
});
test('a failed refresh of a truly empty collection is still marked stale', () => {
  const resource = failedResource(loadedResource([]), new Error());
  assert.equal(countLabel(resource), '0');
  assert.match(resourceCaption(resource), /Last loaded/);
});
const order = (...stages) => ({
  deliveryStatus: 'Pending',
  items: stages.map((deliveryStatus) => ({ deliveryStatus })),
});
test('item stages override a stale parent and delivery alone is not completion', () => {
  assert.equal(orderStage(order('Complete')), 'Complete');
  for (const stage of [
    'Assigned',
    'Shipped',
    'Delivered',
    'Client Confirmed',
    'Traveler Confirmed',
    'CLient Confirmed',
  ])
    assert.equal(orderStage(order(stage)), 'In progress');
});
test('mixed item progress and cancellations are aggregated without inventing completion', () => {
  assert.equal(orderStage(order('Pending', 'Complete')), 'In progress');
  assert.equal(orderStage(order('Cancelled', 'Complete')), 'Complete');
  assert.equal(orderStage(order('Cancelled', 'Pending')), 'Pending');
  assert.equal(orderStage(order('Cancelled', 'Cancelled')), 'Cancelled');
  assert.equal(
    orderStage({ ...order('Complete'), deliveryStatus: 'Cancelled' }),
    'Cancelled',
  );
});
test('unknown or missing stages remain unknown, with a parent fallback for no items', () => {
  assert.equal(orderStage(order('future-stage')), 'Unknown');
  assert.equal(orderStage({ items: [null] }), 'Unknown');
  assert.equal(orderStage({}), 'Unknown');
  assert.equal(
    orderStage({ deliveryStatus: 'Shipped', items: [] }),
    'In progress',
  );
});
test('stage counts reconcile to all records, including unknown states', () => {
  const records = [
    order('Pending'),
    order('Complete'),
    order('Delivered'),
    order('Cancelled'),
    order('new-status'),
  ];
  const counts = stageCounts(records);
  assert.deepEqual(Object.values(counts), [1, 1, 1, 1, 1]);
  assert.equal(
    Object.values(counts).reduce((a, b) => a + b),
    records.length,
  );
  assert.deepEqual(Object.values(stageCounts([])), [0, 0, 0, 0, 0]);
});
test('recent orders sort by real dates without mutating the source and put invalid dates last', () => {
  const records = [
    { _id: 'invalid', createdAt: 'bad' },
    ...[1, 2, 3, 4, 5, 6].map((day) => ({
      _id: String(day),
      createdAt: `2026-10-0${day}T12:00:00Z`,
    })),
  ];
  assert.deepEqual(
    recentOrders(records).map((row) => row._id),
    ['6', '5', '4', '3', '2'],
  );
  assert.equal(records[0]._id, 'invalid');
  assert.equal(recentOrders(records.slice(0, 2)).at(-1)._id, 'invalid');
  assert.equal(orderDate('invalid'), 'Date unavailable');
  assert.equal(orderDate(null), 'Date unavailable');
});
test('nested and previously misidentified navigation paths map to their correct section', () => {
  for (const [path, section] of [
    ['/', 'overview'],
    ['/dashboard', 'overview'],
    ['/users/user-a', 'users'],
    ['/travelers/traveler-a', 'travelers'],
    ['/admins', 'admins'],
    ['/payments', 'payments'],
    ['/profile', 'profile'],
  ])
    assert.equal(sectionForPath(path), section);
});
