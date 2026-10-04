import assert from 'node:assert/strict';
import test from 'node:test';
import axios from 'axios';
import { createSessionClient } from '../src/Services/sessionClient.js';
import { sessionDestination } from '../src/Services/sessionNavigation.js';

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const response = (config, data = {}) => ({ config, data, status: 200, statusText: 'OK', headers: {} });
const fail = (config, status = 401, data = {}) => {
  throw new axios.AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, {}, { ...response(config, data), status });
};
const setup = handler => {
  const calls = [], expirations = [];
  const client = createSessionClient({ adapter: async config => { calls.push(config); return handler(config); } });
  client.session.subscribe(() => expirations.push(true));
  return { ...client, calls, expirations };
};
const isRefresh = config => config.url === '/api/auth/refresh-token';
const tick = () => new Promise(resolve => setImmediate(resolve));
const within = async promise => {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Requests did not settle')), 1000); })]);
  } finally { clearTimeout(timer); }
};

test('resuming a session preserves local payment references and rejects external URLs and redirect loops', () => {
  for (const path of ['/verify-paystack?reference=test-123', '/settings?as=traveler', '/orders/order-1#items']) assert.equal(sessionDestination(path), path);
  for (const path of ['https://example.test', '//example.test', '/\\example.test', '/login', '/signup', '/unknown', '/settings\n', null]) assert.equal(sessionDestination(path), '');
});

test('simultaneous 401s share one refresh and each request retries once with cookies and original payload', async () => {
  const gate = deferred();
  const client = setup(async config => {
    if (isRefresh(config)) { await gate.promise; return response(config); }
    if (!config._retry) fail(config);
    return response(config, { saved: true });
  });
  const requests = ['/api/orders', '/api/cart', '/api/travelers/earnings'].map(url => client.api.post(url, { quantity: 2 }));
  await tick();
  assert.equal(client.calls.filter(isRefresh).length, 1);
  assert.equal(client.calls.find(isRefresh).timeout, 15000);
  gate.resolve();
  assert.equal((await within(Promise.all(requests))).length, 3);
  assert.equal(client.calls.length, 7);
  for (const call of client.calls) assert.equal(call.withCredentials, true);
  for (const call of client.calls.filter(c => c._retry)) assert.equal(call.data, '{"quantity":2}');
  assert.equal(client.expirations.length, 0);
});

for (const status of [401, 403]) test(`refresh ${status} settles every waiter, expires once and blocks further protected requests`, async () => {
  const gate = deferred();
  const client = setup(async config => {
    if (isRefresh(config)) { await gate.promise; fail(config, status); }
    fail(config);
  });
  const pending = Promise.allSettled([client.api.get('/api/orders'), client.api.get('/api/cart')]);
  await tick(); gate.resolve();
  const results = await within(pending);
  assert.ok(results.every(result => result.status === 'rejected' && result.reason.isSessionExpired));
  assert.equal(client.expirations.length, 1);
  assert.equal(client.calls.length, 3);
  await assert.rejects(client.api.get('/api/orders'));
  assert.equal(client.calls.length, 3);
});

test('a retried protected 401 ends the session without another refresh', async () => {
  const client = setup(config => isRefresh(config) ? response(config) : fail(config));
  await assert.rejects(within(client.api.get('/api/orders')), error => error.isSessionExpired);
  assert.equal(client.calls.length, 3);
  assert.equal(client.expirations.length, 1);
});

test('a late 401 from an old cookie reuses the completed refresh', async () => {
  const late = deferred();
  const client = setup(async config => {
    if (isRefresh(config) || config._retry) return response(config);
    if (config.url === '/api/cart') await late.promise;
    fail(config);
  });
  const first = client.api.get('/api/orders');
  const second = client.api.get('/api/cart');
  await first; late.resolve(); await second;
  assert.equal(client.calls.filter(isRefresh).length, 1);
});

test('invalid credentials, OTP, registration, recovery and social errors never refresh or expire a session', async () => {
  const client = setup(config => fail(config));
  const paths = [
    '/api/auth/loginUser', '/api/auth/register', '/api/auth/verifyLoginOTP',
    '/api/auth/verifyUser', '/api/auth/resendVerificationCode', '/api/auth/forgotPassword',
    '/api/auth/resetPassword', '/api/auth/verify-social', '/api/auth/refresh-token',
    '/api/auth/logout', '/api/auth/google/login/initiate?state=test',
    '/api/auth/apple/signup/callback', 'https://example.test/api/auth/loginUser/',
  ];
  for (const url of paths) await assert.rejects(client.api.post(url));
  assert.equal(client.calls.length, paths.length);
  assert.equal(client.expirations.length, 0);
});

for (const kind of ['offline', 'timeout', 'server']) test(`${kind} during refresh preserves the session and permits a later retry`, async () => {
  let recover = false;
  const client = setup(config => {
    if (isRefresh(config)) {
      if (recover) return response(config);
      if (kind === 'server') fail(config, 503);
      throw new axios.AxiosError(kind, kind === 'offline' ? 'ERR_NETWORK' : 'ECONNABORTED', config);
    }
    if (!config._retry) fail(config);
    return response(config);
  });
  await assert.rejects(within(client.api.get('/api/orders')));
  assert.equal(client.expirations.length, 0);
  recover = true;
  await client.api.get('/api/orders');
  assert.equal(client.calls.filter(isRefresh).length, 2);
});

test('non-auth failures and errors without request config reject unchanged', async () => {
  const client = setup(config => fail(config, 403));
  await assert.rejects(client.api.get('/api/orders'), error => error.response.status === 403);
  assert.equal(client.calls.length, 1);
  const unknown = new Error('Transport failed');
  const other = setup(() => { throw unknown; });
  await assert.rejects(other.api.get('/api/orders'), error => error === unknown);
});

test('a new confirmed login resets expiry and old responses cannot replace the new account', async () => {
  const delayed = deferred();
  let expired = true;
  const client = setup(async config => {
    if (config.url === '/api/slow') { await delayed.promise; return response(config, { account: 'old' }); }
    if (expired) fail(config);
    return response(config);
  });
  const stale = client.api.get('/api/slow');
  await assert.rejects(client.api.get('/api/orders'));
  client.session.reset(); expired = false;
  await client.api.get('/api/orders');
  delayed.resolve();
  await assert.rejects(stale, axios.isCancel);
});

test('an old failed refresh cannot invalidate a new login', async () => {
  const gate = deferred();
  const client = setup(async config => {
    if (isRefresh(config)) await gate.promise;
    fail(config);
  });
  const pending = client.api.get('/api/orders');
  await tick(); client.session.reset(); gate.resolve();
  await assert.rejects(pending, axios.isCancel);
  assert.equal(client.expirations.length, 0);
});

test('cancelled waiters are never replayed after refresh', async () => {
  const gate = deferred(), controller = new AbortController();
  const client = setup(async config => {
    if (isRefresh(config)) { await gate.promise; return response(config); }
    fail(config);
  });
  const pending = client.api.get('/api/orders', { signal: controller.signal });
  await tick(); controller.abort(); gate.resolve();
  await assert.rejects(pending, axios.isCancel);
  assert.equal(client.calls.length, 2);
});

test('logout waits for refresh, cancels old retries and sends one logout for simultaneous clicks', async () => {
  const gate = deferred();
  const client = setup(async config => {
    if (isRefresh(config)) { await gate.promise; return response(config); }
    if (config.url === '/api/auth/logout') return response(config);
    fail(config);
  });
  const pending = client.api.get('/api/orders');
  await tick();
  const logout = client.session.logout(), sameLogout = client.session.logout();
  assert.equal(logout, sameLogout);
  assert.equal(client.calls.some(c => c.url.endsWith('/logout')), false);
  gate.resolve();
  await assert.rejects(pending, axios.isCancel);
  await logout;
  assert.equal(client.calls.filter(c => c.url.endsWith('/logout')).length, 1);
  assert.equal(client.calls.filter(c => c.url === '/api/orders').length, 1);
});

test('logout recovers an expired access cookie once, then clears the server session', async () => {
  let attempts = 0;
  const client = setup(config => {
    if (config.url.endsWith('/logout') && ++attempts === 1) fail(config, 400, { message: 'No token provided' });
    return response(config);
  });
  await client.session.logout();
  assert.deepEqual(client.calls.map(c => c.url), ['/api/auth/logout', '/api/auth/refresh-token', '/api/auth/logout']);
});

test('failed logout preserves the session and allows retry', async () => {
  let failLogout = true;
  const client = setup(config => {
    if (config.url.endsWith('/logout') && failLogout) fail(config, 503);
    return response(config);
  });
  await assert.rejects(client.session.logout());
  await client.api.get('/api/orders');
  assert.equal(client.expirations.length, 0);
  failLogout = false; await client.session.logout();
});
