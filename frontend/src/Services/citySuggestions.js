// Failed/aborted requests are not cached, so a later visit can retry normally.
export const createCityLoader = (base, fetcher = fetch) => {
  const cache = new Map();
  return async (country, state, signal) => {
    if (!/^[A-Z]{2}$/.test(country) || !/^[A-Z0-9-]+$/i.test(state)) return [];
    const key = `${country}/${state}`;
    if (cache.has(key)) return cache.get(key);
    const response = await fetcher(`${base}${key}.json`, { signal });
    if (!response.ok) throw new Error('City suggestions are unavailable.');
    const names = await response.json();
    if (!Array.isArray(names) || !names.every(name => typeof name === 'string')) throw new Error('City suggestions are unavailable.');
    if (!signal?.aborted) cache.set(key, names);
    return names;
  };
};
