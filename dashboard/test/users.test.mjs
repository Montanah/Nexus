import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  detailFailure,
  directoryPath,
  readUserDetails,
  readUsersQuery,
  recordedAmount,
  roleLabel,
  safeUsersReturn,
  selectUsers,
  userDate,
  userName,
  userTotals,
  verification,
} from '../src/components/usersModel.js';
const query = (change) => ({
  ...readUsersQuery(new URLSearchParams()),
  ...change,
});
const users = [
  {
    _id: 'a',
    name: 'Amara Wanjiku',
    email: 'amara@example.test',
    phone_number: '+254 700 000 000',
    role: 'client',
    isVerified: true,
    createdAt: '2026-09-01T12:00:00Z',
  },
  {
    _id: 'b',
    name: 'Daniel Otieno',
    role: 'traveler',
    isVerified: false,
    createdAt: '2026-10-01T12:00:00Z',
  },
  { _id: 'missing', role: 'future-role', createdAt: 'invalid' },
];
test('search covers name, email, phone, and ID without case sensitivity', () => {
  for (const search of [' WANJIKU ', 'AMARA@', '700', 'a'])
    assert(
      selectUsers(users, query({ search })).rows.some((row) => row._id === 'a'),
    );
  assert.equal(
    selectUsers(users, query({ search: 'missing' })).rows[0]._id,
    'missing',
  );
  assert.equal(selectUsers(users, query({ search: 'no match' })).total, 0);
});
test('role and verification filters combine and unknown values are not labeled as clients or unverified', () => {
  assert.equal(
    selectUsers(users, query({ role: 'client', verification: 'verified' }))
      .total,
    1,
  );
  assert.equal(
    selectUsers(users, query({ role: 'client', verification: 'unverified' }))
      .total,
    0,
  );
  assert.equal(
    selectUsers(users, query({ role: 'unknown', verification: 'unknown' }))
      .rows[0]._id,
    'missing',
  );
  assert.equal(roleLabel({ role: 'toString' }), 'Unknown role');
  assert.equal(roleLabel({ role: 'superAdmin' }), 'Super admin');
  assert.equal(verification({ isVerified: 'false' }), 'unknown');
  assert.equal(verification({ isVerified: 1 }), 'unknown');
});
test('totals count all loaded records independently of filters', () => {
  assert.deepEqual(userTotals(users), {
    total: 3,
    clients: 1,
    travelers: 1,
    verified: 1,
  });
  assert.deepEqual(userTotals([]), {
    total: 0,
    clients: 0,
    travelers: 0,
    verified: 0,
  });
});
test('sorting keeps missing dates last in either date direction and does not mutate data', () => {
  assert.deepEqual(
    selectUsers(users, query()).rows.map((row) => row._id),
    ['b', 'a', 'missing'],
  );
  assert.deepEqual(
    selectUsers(users, query({ sort: 'oldest' })).rows.map((row) => row._id),
    ['a', 'b', 'missing'],
  );
  assert.deepEqual(
    users.map((row) => row._id),
    ['a', 'b', 'missing'],
  );
  assert.equal(userDate(null), 'Not available');
  assert.equal(userDate('invalid'), 'Not available');
  assert.equal(userName({ name: {} }), 'Name unavailable');
});
test('pagination clamps after filtering or record changes, including empty results', () => {
  const records = Array.from({ length: 23 }, (_, index) => ({
    ...users[0],
    _id: String(index).padStart(2, '0'),
  }));
  const last = selectUsers(records, query({ page: 999 }));
  assert.equal(last.page, 3);
  assert.equal(last.rows.length, 3);
  assert.equal(last.start, 21);
  assert.equal(last.end, 23);
  const empty = selectUsers([], query({ page: 10 }));
  assert.equal(empty.page, 1);
  assert.equal(empty.start, 0);
  assert.equal(empty.end, 0);
});
test('URL filters validate roles, sorting, verification, page, and query length', () => {
  const read = readUsersQuery(
    new URLSearchParams(
      'role=not-a-role&sort=bad&verification=bad&page=-1&q=' + 'a'.repeat(400),
    ),
  );
  assert.equal(read.role, 'all');
  assert.equal(read.sort, 'newest');
  assert.equal(read.verification, 'all');
  assert.equal(read.page, 1);
  assert.equal(read.search.length, 200);
  assert.equal(
    readUsersQuery(new URLSearchParams('page=9999999999999999999999')).page,
    1,
  );
});
test('directory filters round-trip through the profile return link', () => {
  const state = query({
    search: 'Amara & Nia',
    role: 'client',
    verification: 'verified',
    sort: 'name',
    page: 2,
  });
  const path = directoryPath(state);
  assert.deepEqual(
    readUsersQuery(new URLSearchParams(path.split('?')[1])),
    state,
  );
  assert.equal(safeUsersReturn(path), path);
  for (const unsafe of [
    'https://example.test',
    '//example.test',
    '/users/other',
    '/orders',
    null,
    '/users#evil',
  ])
    assert.equal(safeUsersReturn(unsafe), '/users');
});
test('profile responses must acknowledge the requested account', () => {
  const valid = { data: { user: users[0], orders: [], payments: [] } };
  assert.deepEqual(readUserDetails(valid, 'a'), valid.data);
  for (const payload of [
    {},
    { data: {} },
    { data: { user: users[1] } },
    { success: false, ...valid },
    { data: { ...valid.data, success: false } },
  ])
    assert.throws(() => readUserDetails(payload, 'a'));
});
test('missing or malformed histories remain unavailable rather than becoming empty', () => {
  const result = readUserDetails(
    { data: { user: users[0], orders: [null], payments: {} } },
    'a',
  );
  assert.equal(result.orders, null);
  assert.equal(result.payments, null);
  assert.equal(readUserDetails({ data: { user: users[0] } }, 'a').orders, null);
  assert.deepEqual(
    readUserDetails({ data: { user: users[0], orders: [], payments: [] } }, 'a')
      .orders,
    [],
  );
});
test('profile refresh failures preserve the snapshot; 404 and 403 clear it with distinct states', () => {
  const previous = {
    data: { user: users[0], orders: [], payments: [] },
    status: 'ready',
    updatedAt: 123,
  };
  const failed = detailFailure(previous, new Error());
  assert.equal(failed.data, previous.data);
  assert.equal(failed.updatedAt, 123);
  assert.equal(failed.status, 'error');
  for (const [code, status] of [
    [404, 'missing'],
    [403, 'restricted'],
  ]) {
    const result = detailFailure(previous, { response: { status: code } });
    assert.equal(result.data, null);
    assert.equal(result.status, status);
    assert.equal(result.updatedAt, null);
  }
});
test('recorded payment amounts preserve real zero and do not invent missing amounts', () => {
  assert.equal(recordedAmount(0), '0');
  for (const value of [null, undefined, '100', NaN, Infinity, -1])
    assert.equal(recordedAmount(value), 'Not available');
});
