import { applyDeliveryConfirmation, getItems, getItemStatus, getProductId } from './clientDashboardModel.js';

const text = value => typeof value === 'string' ? value.trim() : '';
const number = value => value === '' || value == null || !Number.isFinite(Number(value)) ? null : Number(value);
export const deliverySteps = ['Order placed', 'Traveler assigned', 'On the way', 'Ready to receive', 'Receipt confirmed', 'Completed'];
export const deliveryStep = status => ({ Pending: 0, Assigned: 1, Shipped: 2, 'Traveler Confirmed': 3, 'Client Confirmed': 4, Complete: 5, Delivered: 5 }[status] ?? -1);

export const validateOrderDetails = (order, orderNumber) => {
  if (!order || order.orderNumber !== orderNumber) throw new Error('Order details are unavailable.');
  return { ...order, items: getItems(order) };
};

export const canConfirmReceipt = (order, productId) => Boolean(productId) && order?.deliveryStatus !== 'Cancelled'
  && getItems(order).some(item => getProductId(item) === productId && getItemStatus(item) === 'Traveler Confirmed');

export const confirmOrderItem = (order, productId) => canConfirmReceipt(order, productId) ? applyDeliveryConfirmation([order], productId)[0] : order;

export const receiptConfirmed = (response, productId) => response?.success === true
  && response.data?.productId === productId && response.data?.deliveryStatus === 'Client Confirmed';

export const destinationLabel = destination => {
  const city = text(destination?.city), country = text(destination?.country);
  let countryName = country;
  if (/^[a-z]{2}$/i.test(country)) {
    try { countryName = new Intl.DisplayNames(['en'], { type: 'region' }).of(country.toUpperCase()) || country; } catch { /* Preserve the supplied country. */ }
  }
  return [city, countryName].filter(Boolean).join(', ') || 'Destination unavailable';
};

export const orderItemDetails = (item, order) => {
  const product = item?.product && typeof item.product === 'object' ? item.product : {};
  const quantity = Number.isSafeInteger(Number(item.quantity)) && Number(item.quantity) > 0 ? Number(item.quantity) : null;
  const unitTotal = number(product.totalPrice);
  const status = order?.deliveryStatus === 'Cancelled' ? 'Cancelled' : getItemStatus(item);
  const traveler = item.claimedBy || product.claimedBy;
  const travelerName = text(traveler?.userId?.name);
  return {
    id: getProductId(item), name: text(product.productName) || 'Product details unavailable',
    category: text(product.categoryName) || text(product.productCategory?.categoryName) || 'Your item',
    description: text(product.productDescription), photos: Array.isArray(product.productPhotos) ? product.productPhotos.filter(photo => typeof photo === 'string' && photo) : [],
    quantity, unitTotal: unitTotal !== null && unitTotal >= 0 ? unitTotal : null,
    status, step: deliveryStep(status), destination: destinationLabel(product.destination),
    arrival: product.deliverydate, dimensions: text(product.productDimensions), weight: number(product.productWeight), notes: text(product.shippingRestrictions),
    traveler: travelerName || (traveler || deliveryStep(status) > 0 ? 'Traveler assigned' : 'Not assigned yet'),
    travelerNamed: Boolean(travelerName), rating: number(item.travelerRating),
    canConfirm: canConfirmReceipt(order, getProductId(item)),
    // The current rating endpoint accepts these two stages only.
    canRate: ['Client Confirmed', 'Delivered'].includes(status) && Boolean(getProductId(item) && traveler) && item.travelerRating == null,
  };
};
