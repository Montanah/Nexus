import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const moduleId = 'virtual:nexus-locations';
const resolvedId = `\0${moduleId}`;
const compareNames = (a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0;

// Preserve the installed dataset's names/codes, but omit coordinates and unused metadata.
export const compactLocations = (countries, states, cities) => {
  const statesByCountry = {};
  const cityNames = new Map();
  const regionKey = (country, state) => {
    if (!/^[A-Z]{2}$/.test(country) || !/^[A-Z0-9-]+$/i.test(state)) throw new Error('Unsupported location code in country-state-city data.');
    return `${country}/${state}`;
  };
  for (const { name, isoCode, countryCode } of states) {
    (statesByCountry[countryCode] ??= []).push({ name, isoCode });
    cityNames.set(regionKey(countryCode, isoCode), new Set());
  }
  for (const [name, country, state] of cities) {
    const key = regionKey(country, state);
    if (!cityNames.has(key)) cityNames.set(key, new Set());
    cityNames.get(key).add(name);
  }
  for (const values of Object.values(statesByCountry)) values.sort(compareNames);
  return {
    countries: countries.map(({ name, isoCode }) => ({ name, isoCode })),
    statesByCountry,
    regions: new Map([...cityNames].map(([key, names]) => [key, JSON.stringify([...names].sort())])),
  };
};

export const locationData = () => {
  let data, folder, config;
  const prepare = () => {
    if (data) return;
    const require = createRequire(import.meta.url);
    const assets = join(dirname(require.resolve('country-state-city/package.json')), 'lib/assets');
    const read = name => JSON.parse(readFileSync(join(assets, `${name}.json`), 'utf8'));
    data = compactLocations(read('country'), read('state'), read('city'));
    const hash = createHash('sha256');
    for (const [key, names] of data.regions) hash.update(key).update(names);
    folder = `assets/cities-${hash.digest('hex').slice(0, 12)}`;
  };
  return {
    name: 'nexus-location-data',
    configResolved(value) { config = value; },
    resolveId(id) { if (id === moduleId) return resolvedId; },
    load(id) {
      if (id !== resolvedId) return;
      prepare();
      const base = config.command === 'build'
        ? `new URL('.', new URL(import.meta.ROLLUP_FILE_URL_${this.emitFile({ type: 'asset', fileName: `${folder}/index.json`, source: '{}' })}, import.meta.url)).href`
        : JSON.stringify(`${config.base}${folder}/`);
      return `export const countries = ${JSON.stringify(data.countries)};\nexport const statesByCountry = ${JSON.stringify(data.statesByCountry)};\nexport const cityDataBase = ${base};`;
    },
    generateBundle() {
      if (!data) return;
      for (const [region, source] of data.regions) this.emitFile({ type: 'asset', fileName: `${folder}/${region}.json`, source });
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url, 'http://nexus.local').pathname;
        const prefix = `${config.base}assets/cities-`;
        if (!pathname.startsWith(prefix)) return next();
        prepare();
        const currentPrefix = `${config.base}${folder}/`;
        const region = pathname.startsWith(currentPrefix) ? pathname.slice(currentPrefix.length).replace(/\.json$/, '') : '';
        const source = region === 'index' ? '{}' : data.regions.get(region);
        response.statusCode = source === undefined ? 404 : 200;
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', 'no-cache');
        response.end(request.method === 'HEAD' ? undefined : source ?? '[]');
      });
    },
  };
};
