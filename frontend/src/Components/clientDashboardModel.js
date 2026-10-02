export const getItems = order => Array.isArray(order?.items) ? order.items.filter(item => item && typeof item === 'object') : [];
export const getProductId = item => typeof item?.product === 'string' ? item.product : item?.product?._id || '';
export const getItemStatus = item => item?.deliveryStatus || item?.product?.deliveryStatus || 'Pending';

export const statusLabels = {
  Pending: 'Finding a traveler',
  Assigned: 'Traveler assigned',
  Shipped: 'On the way',
  'Traveler Confirmed': 'Confirm arrival',
  'Client Confirmed': 'Receipt confirmed',
  Complete: 'Completed',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
};

const finished = status => ['Complete', 'Delivered'].includes(status);
export const needsConfirmation = order => getItems(order).some(item => getItemStatus(item) === 'Traveler Confirmed');

// Item statuses are authoritative: the client confirmation endpoint updates
// individual items without updating the order's top-level deliveryStatus.
export const getOrderStatus = order => {
  if (order?.deliveryStatus === 'Cancelled') return 'Cancelled';
  const statuses = getItems(order).map(getItemStatus);
  if (!statuses.length) return order?.deliveryStatus || 'Pending';
  if (statuses.every(status => status === 'Cancelled')) return 'Cancelled';
  const active = statuses.filter(status => status !== 'Cancelled');
  if (active.every(finished)) return active.every(status => status === 'Complete') ? 'Complete' : 'Delivered';
  if (active.includes('Traveler Confirmed')) return 'Traveler Confirmed';
  if (active.every(status => finished(status) || status === 'Client Confirmed')) return 'Client Confirmed';
  for (const status of ['Pending', 'Assigned', 'Shipped']) if (active.includes(status)) return status;
  return active[0] || 'Pending';
};

export const matchesOrderFilter = (order, filter) => {
  const status = getOrderStatus(order);
  if (filter === 'active') return !finished(status) && status !== 'Cancelled';
  if (filter === 'confirm') return status !== 'Cancelled' && needsConfirmation(order);
  if (filter === 'complete') return finished(status);
  return true;
};

export const searchOrder = (order, query) => {
  const text = [order?.orderNumber, ...getItems(order).map(item => item.product?.productName || '')].join(' ').toLowerCase();
  return text.includes(query.trim().toLowerCase());
};

export const formatMoney = value => {
  if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) return '—';
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', currencyDisplay: 'code', maximumFractionDigits: 2 }).format(Number(value));
};

export const formatDate = (value, fallback = 'Not scheduled') => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};

export const applyDeliveryConfirmation = (orders, productId) => orders.map(order => ({
  ...order,
  items: getItems(order).map(item => getProductId(item) === productId ? { ...item, deliveryStatus: 'Client Confirmed' } : item),
}));
