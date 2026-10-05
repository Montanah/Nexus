export const textValue = (value) =>
  typeof value === 'string' ? value.trim() : '';
export const userName = (user) => textValue(user?.name) || 'Name unavailable';
const roles = {
  client: 'Client',
  traveler: 'Traveler',
  user: 'User',
  admin: 'Admin',
  superAdmin: 'Super admin',
};
export const roleLabel = (user) =>
  Object.hasOwn(roles, textValue(user?.role))
    ? roles[textValue(user.role)]
    : 'Unknown role';
export const verification = (user) =>
  user?.isVerified === true
    ? 'verified'
    : user?.isVerified === false
      ? 'unverified'
      : 'unknown';
export const verificationLabel = (user) =>
  ({ verified: 'Verified', unverified: 'Unverified', unknown: 'Unknown' })[
    verification(user)
  ];
export const timestamp = (value) =>
  typeof value === 'string' &&
  value.trim() &&
  Number.isFinite(Date.parse(value))
    ? Date.parse(value)
    : null;
export const userDate = (value) =>
  timestamp(value) === null
    ? 'Not available'
    : new Date(value).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
export const userTotals = (users) => ({
  total: users.length,
  clients: users.filter((user) => textValue(user.role) === 'client').length,
  travelers: users.filter((user) => textValue(user.role) === 'traveler').length,
  verified: users.filter((user) => verification(user) === 'verified').length,
});
export const pageSize = 10;
export const readUsersQuery = (params) => ({
  search: (params.get('q') || '').slice(0, 200),
  role: [
    'client',
    'traveler',
    'user',
    'admin',
    'superAdmin',
    'unknown',
  ].includes(params.get('role'))
    ? params.get('role')
    : 'all',
  verification: ['verified', 'unverified', 'unknown'].includes(
    params.get('verification'),
  )
    ? params.get('verification')
    : 'all',
  sort: ['newest', 'oldest', 'name'].includes(params.get('sort'))
    ? params.get('sort')
    : 'newest',
  page:
    /^\d+$/.test(params.get('page') || '') &&
    Number.isSafeInteger(Number(params.get('page')))
      ? Math.max(1, Number(params.get('page')))
      : 1,
});
export const usersSearchParams = (query) => {
  const params = new URLSearchParams();
  if (query.search) params.set('q', query.search);
  if (query.role !== 'all') params.set('role', query.role);
  if (query.verification !== 'all')
    params.set('verification', query.verification);
  if (query.sort !== 'newest') params.set('sort', query.sort);
  if (query.page > 1) params.set('page', String(query.page));
  return params;
};
export const directoryPath = (query) =>
  `/users${usersSearchParams(query).size ? `?${usersSearchParams(query)}` : ''}`;
export const safeUsersReturn = (value) => {
  if (typeof value !== 'string' || !/^\/users(?:\?|$)/.test(value))
    return '/users';
  return directoryPath(
    readUsersQuery(new URLSearchParams(value.split('?').slice(1).join('?'))),
  );
};
export const selectUsers = (users, query) => {
  const search = query.search.trim().toLocaleLowerCase();
  const filtered = users.filter(
    (user) =>
      (!search ||
        [user.name, user.email, user.phone_number, user._id].some((value) =>
          textValue(value).toLocaleLowerCase().includes(search),
        )) &&
      (query.role === 'all' ||
        (query.role === 'unknown'
          ? !Object.hasOwn(roles, textValue(user.role))
          : textValue(user.role) === query.role)) &&
      (query.verification === 'all' ||
        verification(user) === query.verification),
  );
  filtered.sort((a, b) => {
    if (query.sort === 'name')
      return (
        userName(a).localeCompare(userName(b)) || a._id.localeCompare(b._id)
      );
    const first = timestamp(a.createdAt),
      second = timestamp(b.createdAt);
    if (first === null || second === null)
      return first === second
        ? a._id.localeCompare(b._id)
        : first === null
          ? 1
          : -1;
    return (
      (query.sort === 'oldest' ? first - second : second - first) ||
      a._id.localeCompare(b._id)
    );
  });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize)),
    page = Math.min(query.page, pages);
  return {
    rows: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    pages,
    page,
    start: filtered.length ? (page - 1) * pageSize + 1 : 0,
    end: Math.min(page * pageSize, filtered.length),
  };
};
const collection = (records) =>
  Array.isArray(records) &&
  records.every(
    (record) =>
      record &&
      typeof record === 'object' &&
      typeof record._id === 'string' &&
      record._id,
  )
    ? records
    : null;
export const readUserDetails = (payload, expectedId) => {
  const data = payload?.data;
  if (
    payload?.success === false ||
    data?.success === false ||
    !data?.user ||
    data.user._id !== expectedId
  )
    throw new Error('User details could not be confirmed.');
  return {
    user: data.user,
    orders: collection(data.orders),
    payments: collection(data.payments),
  };
};
export const detailFailure = (previous, error) => {
  const status = error?.response?.status;
  return status === 403 || status === 404
    ? {
        data: null,
        status: status === 403 ? 'restricted' : 'missing',
        updatedAt: null,
      }
    : { ...previous, status: 'error' };
};
export const recordedAmount = (value) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : 'Not available';
