import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { compactLocations } from '../build/locationData.mjs';
import { createCityLoader } from '../src/Services/citySuggestions.js';

const require = createRequire(import.meta.url);
const root = join(dirname(require.resolve('country-state-city/package.json')), 'lib/assets');
const read = name => JSON.parse(readFileSync(join(root, `${name}.json`), 'utf8'));
const countries = read('country'), states = read('state'), cities = read('city');
const compact = compactLocations(countries, states, cities);
const compare = (a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0;

test('compact data preserves every country and region name/code and existing sort order', () => {
  assert.deepEqual(compact.countries, countries.map(({ name, isoCode }) => ({ name, isoCode })));
  for (const country of countries) {
    assert.deepEqual(compact.statesByCountry[country.isoCode] || [], states.filter(state => state.countryCode === country.isoCode).sort(compare).map(({ name, isoCode }) => ({ name, isoCode })));
  }
});

test('every region retains exactly its original city suggestions, including empty regions', () => {
  const expected = new Map(states.map(state => [`${state.countryCode}/${state.isoCode}`, new Set()]));
  for (const [name, country, state] of cities) {
    const key = `${country}/${state}`;
    if (!expected.has(key)) expected.set(key, new Set());
    expected.get(key).add(name);
  }
  assert.equal(compact.regions.size, expected.size);
  for (const [key, names] of expected) assert.deepEqual(JSON.parse(compact.regions.get(key)), [...names].sort(), key);
  assert.deepEqual(JSON.parse(compact.regions.get('KE/30')), ['Nairobi']);
});

test('city downloads stay below 50 KB per region and no coordinate metadata is shipped', () => {
  for (const [key, source] of compact.regions) {
    assert.ok(Buffer.byteLength(source) < 50_000, `${key} needs a smaller download`);
    assert.ok(JSON.parse(source).every(name => typeof name === 'string'));
  }
  assert.ok(Buffer.byteLength(JSON.stringify(compact.statesByCountry)) < 250_000);
});

test('the loader fetches only the requested region and reuses successful responses', async () => {
  const calls = [];
  const load = createCityLoader('/assets/cities-test/', async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ['Nairobi'] };
  });
  const controller = new AbortController();
  assert.deepEqual(await load('KE', '30', controller.signal), ['Nairobi']);
  assert.deepEqual(await load('KE', '30'), ['Nairobi']);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/assets/cities-test/KE/30.json');
  assert.equal(calls[0].options.signal, controller.signal);
  for (const pair of [['', '30'], ['KE', ''], ['KE', '../30'], ['//evil', '30'], ['KE', 'Nairobi County']]) assert.deepEqual(await load(...pair), []);
  assert.equal(calls.length, 1);
});

test('failed or malformed downloads can retry without poisoning the location cache', async () => {
  let mode = 'error', calls = 0;
  const load = createCityLoader('/cities/', async () => {
    calls += 1;
    return { ok: mode !== 'error', json: async () => mode === 'invalid' ? { city: 'Nairobi' } : ['Nairobi'] };
  });
  await assert.rejects(load('KE', '30'));
  mode = 'invalid'; await assert.rejects(load('KE', '30'));
  mode = 'ok'; assert.deepEqual(await load('KE', '30'), ['Nairobi']);
  assert.equal(calls, 3);
});

test('aborted downloads never become cached suggestions for later visits', async () => {
  const controller = new AbortController();
  let calls = 0;
  const load = createCityLoader('/cities/', async () => {
    calls += 1; controller.abort();
    return { ok: true, json: async () => ['Nairobi'] };
  });
  await load('KE', '30', controller.signal);
  await load('KE', '30');
  assert.equal(calls, 2);
});
