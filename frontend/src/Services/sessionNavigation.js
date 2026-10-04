// Only resume known local account routes; never follow a login-supplied external URL.
export const sessionDestination = value => {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')
    || value.includes('\\') || [...value].some(character => character.charCodeAt(0) <= 32)) return '';
  const url = new URL(value, 'https://nexus.invalid');
  return /^\/(client-dashboard|traveler-dashboard|new-order|cart|checkout|payment-success|payment-failure|settings|verify-paystack|orders\/[^/]+|product-details\/[^/]+|rate-product\/[^/]+)$/.test(url.pathname)
    ? `${url.pathname}${url.search}${url.hash}` : '';
};
