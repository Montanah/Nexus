export const resourceNames = {
  users: 'Users',
  products: 'Products',
  orders: 'Orders',
  travelers: 'Travelers',
};
export const resourceKeys = Object.keys(resourceNames);
export const canRead = (admin, resource) =>
  Array.isArray(admin?.permissions) &&
  (admin.permissions.includes('all') ||
    admin.permissions.includes(`${resource}.read`));
export const canVisit = (admin, section) =>
  ['overview', 'profile', 'edit-profile'].includes(section) ||
  (section === 'admins'
    ? admin?.role === 'superadmin'
    : canRead(admin, section));
export const initialResources = (admin) =>
  Object.fromEntries(
    resourceKeys.map((key) => [
      key,
      {
        data: null,
        status: canRead(admin, key) ? 'loading' : 'restricted',
        error: '',
        updatedAt: null,
      },
    ]),
  );
export const readCollection = (payload, key) => {
  const records =
    payload?.data?.[key] ??
    (key === 'travelers' && Array.isArray(payload?.data) ? payload.data : null);
  if (
    payload?.success === false ||
    !Array.isArray(records) ||
    records.some(
      (record) =>
        !record ||
        typeof record !== 'object' ||
        Array.isArray(record) ||
        typeof record._id !== 'string' ||
        !record._id,
    )
  ) {
    throw new Error(`${resourceNames[key]} could not be confirmed.`);
  }
  return records;
};
export const loadedResource = (data, time = Date.now()) => ({
  data,
  status: 'ready',
  error: '',
  updatedAt: time,
});
export const failedResource = (previous, failure) =>
  failure?.response?.status === 403
    ? {
        data: null,
        status: 'restricted',
        error: 'Your account cannot view this information.',
        updatedAt: null,
      }
    : {
        ...previous,
        status: 'error',
        error: 'We couldn’t load this information. Please try again.',
      };
export const resourceCount = (resource) =>
  Array.isArray(resource?.data) ? resource.data.length : null;
export const countLabel = (resource) =>
  resourceCount(resource)?.toLocaleString() ?? '—';
export const resourceCaption = (resource) =>
  resource?.status === 'restricted'
    ? 'Access restricted'
    : resource?.status === 'error'
      ? resource.data
        ? 'Last loaded · refresh failed'
        : 'Couldn’t load'
      : resource?.status === 'loading'
        ? resource.data
          ? 'Refreshing · last loaded'
          : 'Loading…'
        : resource?.updatedAt
          ? `Loaded ${new Date(resource.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : 'Not loaded';
const normalizeStage = (value) =>
  typeof value === 'string' ? value.toLowerCase().trim() : '';
const activeStages = new Set([
  'assigned',
  'shipped',
  'delivered',
  'client confirmed',
  'traveler confirmed',
]);
export const orderStage = (order) => {
  if (normalizeStage(order.deliveryStatus) === 'cancelled') return 'Cancelled';
  const stages =
    Array.isArray(order.items) && order.items.length
      ? order.items.map((item) => normalizeStage(item?.deliveryStatus))
      : [normalizeStage(order.deliveryStatus)];
  if (
    stages.some(
      (stage) =>
        !['pending', 'complete', 'cancelled'].includes(stage) &&
        !activeStages.has(stage),
    )
  )
    return 'Unknown';
  if (stages.every((stage) => stage === 'cancelled')) return 'Cancelled';
  const remaining = stages.filter((stage) => stage !== 'cancelled');
  if (remaining.every((stage) => stage === 'complete')) return 'Complete';
  if (remaining.every((stage) => stage === 'pending')) return 'Pending';
  return 'In progress';
};
export const stageCounts = (orders) =>
  orders.reduce(
    (counts, order) => {
      counts[orderStage(order)] += 1;
      return counts;
    },
    { Pending: 0, 'In progress': 0, Complete: 0, Cancelled: 0, Unknown: 0 },
  );
const timestamp = (value) =>
  typeof value === 'string' && value ? Date.parse(value) : NaN;
export const recentOrders = (orders) =>
  [...orders]
    .sort(
      (a, b) =>
        (Number.isFinite(timestamp(b.createdAt))
          ? timestamp(b.createdAt)
          : -Infinity) -
        (Number.isFinite(timestamp(a.createdAt))
          ? timestamp(a.createdAt)
          : -Infinity),
    )
    .slice(0, 5);
export const orderDate = (value) =>
  Number.isFinite(timestamp(value))
    ? new Date(value).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Date unavailable';
export const initials = (name) =>
  (typeof name === 'string'
    ? name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
    : '') || 'AD';
export const sectionForPath = (path) =>
  ({ dashboard: 'overview', '': 'overview' })[path.split('/')[1]] ||
  path.split('/')[1];
export const pageTitles = {
  overview: 'Overview',
  users: 'Users',
  products: 'Products',
  orders: 'Orders',
  travelers: 'Travelers',
  transactions: 'Transactions',
  payments: 'Payments',
  analytics: 'Analytics',
  admins: 'Admin management',
  profile: 'Your profile',
  'edit-profile': 'Edit profile',
};
