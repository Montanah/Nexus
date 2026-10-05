import { orderStage } from './overviewModel.js';
import { textValue, timestamp } from './usersModel.js';

export const referenceId = (value) =>
  typeof value === 'string' ? value.trim() : textValue(value?._id);
export const orderReference = (order) =>
  textValue(order?.orderNumber) || 'Reference unavailable';
export const orderItems = (order) =>
  Array.isArray(order?.items) &&
  order.items.every(
    (item) => item && typeof item === 'object' && !Array.isArray(item),
  )
    ? order.items
    : null;
export const paymentStatus = (order) =>
  ['Pending', 'Paid', 'Failed'].includes(order?.paymentStatus)
    ? order.paymentStatus
    : 'Unknown';
export const deliveryStages = [
  'Pending',
  'In progress',
  'Complete',
  'Cancelled',
  'Unknown',
];
export const itemStage = (item) => {
  const stages = [
    'Pending',
    'Assigned',
    'Shipped',
    'Delivered',
    'Cancelled',
    'Client Confirmed',
    'Traveler Confirmed',
    'Complete',
  ];
  return (
    stages.find(
      (stage) =>
        stage.toLowerCase() === textValue(item?.deliveryStatus).toLowerCase(),
    ) || 'Unknown'
  );
};
export const assignment = (order) => {
  const items = orderItems(order);
  if (
    !items?.length ||
    items.some(
      (item) => item.claimedBy !== null && !referenceId(item.claimedBy),
    )
  )
    return 'Unknown';
  const assigned = items.filter((item) => referenceId(item.claimedBy)).length;
  return assigned === 0
    ? 'Unassigned'
    : assigned === items.length
      ? 'Assigned'
      : 'Mixed';
};
export const lookupIndexes = (resources) =>
  Object.fromEntries(
    ['users', 'travelers', 'products'].map((key) => [
      key,
      new Map(
        (resources[key]?.status !== 'restricted' &&
        Array.isArray(resources[key]?.data)
          ? resources[key].data
          : []
        ).map((record) => [record._id, record]),
      ),
    ]),
  );
const unavailable = (resource, noun) =>
  resource?.status === 'restricted'
    ? `${noun} details restricted`
    : resource?.status === 'loading' && !resource.data
      ? `Loading ${noun.toLowerCase()}…`
      : `${noun} details unavailable`;
export const clientInfo = (order, resources, indexes) => {
  const id = referenceId(order?.userId),
    record = indexes.users.get(id);
  return {
    id,
    name: textValue(record?.name) || unavailable(resources.users, 'Client'),
    record,
  };
};
export const travelerInfo = (item, resources, indexes) => {
  if (item?.claimedBy === null)
    return { id: '', name: 'Unassigned', record: null };
  const id = referenceId(item?.claimedBy),
    record = indexes.travelers.get(id);
  if (!id) return { id: '', name: 'Assignment unavailable', record: null };
  const account = record ? indexes.users.get(referenceId(record.userId)) : null;
  return {
    id,
    name:
      textValue(account?.name) ||
      unavailable(record ? resources.users : resources.travelers, 'Traveler'),
    record,
  };
};
export const productInfo = (item, resources, indexes) => {
  const id = referenceId(item?.product),
    record = indexes.products.get(id);
  return {
    id,
    name:
      textValue(record?.productName) ||
      unavailable(resources.products, 'Product'),
    record,
  };
};
export const itemQuantity = (item) =>
  Number.isSafeInteger(item?.quantity) && item.quantity > 0
    ? item.quantity.toLocaleString()
    : 'Unavailable';
export const productDestination = (product) =>
  [
    product?.destination?.city,
    product?.destination?.state,
    product?.destination?.country,
  ]
    .map(textValue)
    .filter(Boolean)
    .join(', ') || 'Unavailable';
export const readOrderDetails = (payload, expectedId) => {
  const order = payload?.data?.order;
  if (
    typeof expectedId !== 'string' ||
    !expectedId ||
    payload?.success === false ||
    payload?.data?.success === false ||
    !order ||
    Array.isArray(order) ||
    order._id !== expectedId
  )
    throw new Error('Order details could not be confirmed.');
  return order;
};
export const readOrdersQuery = (params) => ({
  search: (params.get('q') || '').slice(0, 200),
  client: (params.get('client') || '').slice(0, 100),
  traveler: (params.get('traveler') || '').slice(0, 100),
  stage: deliveryStages.includes(params.get('stage'))
    ? params.get('stage')
    : 'all',
  payment: ['Pending', 'Paid', 'Failed', 'Unknown'].includes(
    params.get('payment'),
  )
    ? params.get('payment')
    : 'all',
  assignment: ['Unassigned', 'Assigned', 'Mixed', 'Unknown'].includes(
    params.get('assignment'),
  )
    ? params.get('assignment')
    : 'all',
  sort: ['newest', 'oldest', 'reference'].includes(params.get('sort'))
    ? params.get('sort')
    : 'newest',
  page:
    /^\d+$/.test(params.get('page') || '') &&
    Number.isSafeInteger(Number(params.get('page')))
      ? Math.max(1, Number(params.get('page')))
      : 1,
});
export const ordersSearchParams = (query) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (['search', 'client', 'traveler'].includes(key) && value)
      params.set(key === 'search' ? 'q' : key, value);
    if (['stage', 'payment', 'assignment'].includes(key) && value !== 'all')
      params.set(key, value);
    if (key === 'sort' && value !== 'newest') params.set(key, value);
    if (key === 'page' && value > 1) params.set(key, String(value));
  }
  return params;
};
export const ordersPath = (query) =>
  `/orders${ordersSearchParams(query).size ? `?${ordersSearchParams(query)}` : ''}`;
export const safeOrdersReturn = (value) =>
  typeof value === 'string' && /^\/orders(?:\?|$)/.test(value)
    ? ordersPath(
        readOrdersQuery(
          new URLSearchParams(value.split('?').slice(1).join('?')),
        ),
      )
    : '/orders';
const matches = (values, search) =>
  values.some((value) =>
    textValue(value)
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
export const selectOrders = (
  orders,
  query,
  resources,
  indexes = lookupIndexes(resources),
) => {
  const filtered = orders.filter((order) => {
    const client = clientInfo(order, resources, indexes),
      items = orderItems(order) || [];
    const products = items.map((item) => productInfo(item, resources, indexes));
    // Search only supplied names and IDs, never placeholder labels such as "Unassigned".
    const clientValues = [client.id, client.record?.name];
    const travelerValues = items.flatMap((item) => {
      const traveler = indexes.travelers.get(referenceId(item.claimedBy));
      return [
        referenceId(item.claimedBy),
        indexes.users.get(referenceId(traveler?.userId))?.name,
      ];
    });
    const all = [
      order._id,
      order.orderNumber,
      ...clientValues,
      ...travelerValues,
      ...products.flatMap((product) => [
        product.id,
        product.record?.productName,
      ]),
    ];
    return (
      (!query.search || matches(all, query.search)) &&
      (!query.client || matches(clientValues, query.client)) &&
      (!query.traveler || matches(travelerValues, query.traveler)) &&
      (query.stage === 'all' || orderStage(order) === query.stage) &&
      (query.payment === 'all' || paymentStatus(order) === query.payment) &&
      (query.assignment === 'all' || assignment(order) === query.assignment)
    );
  });
  filtered.sort((a, b) => {
    if (query.sort === 'reference')
      return (
        orderReference(a).localeCompare(orderReference(b), undefined, {
          numeric: true,
        }) || a._id.localeCompare(b._id)
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
  const pages = Math.max(1, Math.ceil(filtered.length / 10)),
    page = Math.min(query.page, pages);
  return {
    rows: filtered.slice((page - 1) * 10, page * 10),
    total: filtered.length,
    pages,
    page,
    start: filtered.length ? (page - 1) * 10 + 1 : 0,
    end: Math.min(page * 10, filtered.length),
  };
};
export const proofUrl = (value) => {
  try {
    const url = new URL(textValue(value));
    return url.protocol === 'https:' && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
};
