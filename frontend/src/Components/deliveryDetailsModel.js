import { normalizeProduct } from './travelerDashboardModel.js';

const text = value => typeof value === 'string' ? value.trim() : '';
const positive = value => value !== '' && value != null && Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : null;
export const deliveryContext = (available, claimed, productId) => {
  if (!Array.isArray(available) || !Array.isArray(claimed)) throw new Error('Delivery lists are unavailable.');
  const own = claimed.find(product => product?._id === productId);
  const listed = available.find(product => product?._id === productId);
  const source = own || listed;
  if (!productId || !source) return null;
  const product = {
    ...normalizeProduct(source),
    productName: text(source.productName) || 'Product details unavailable',
    deliveryStatus: text(source.deliveryStatus) || 'Unknown',
    categoryName: text(source.categoryName) || 'Not provided',
    productDescription: text(source.productDescription),
    productDimensions: text(source.productDimensions), shippingRestrictions: text(source.shippingRestrictions),
    quantity: positive(source.quantity), productWeight: positive(source.productWeight),
    urgencyLevel: ['low', 'medium', 'high'].includes(source.urgencyLevel) ? source.urgencyLevel : '',
    productPhotos: Array.isArray(source.productPhotos) ? source.productPhotos.filter(photo => typeof photo === 'string' && /^(https?:\/\/|data:image\/(png|jpeg|webp);base64,|\/(?!\/))/.test(photo)) : [],
  };
  return { product, owned: Boolean(own), available: !own && !product.claimedBy && product.deliveryStatus === 'Pending' && source.isDelivered !== true };
};

export const deliveryAction = context => {
  if (!context) return '';
  if (context.available) return 'claim';
  if (!context.owned) return '';
  const product = context.product;
  if (product.deliveryStatus === 'Client Confirmed') return product.proofUploaded ? 'finish' : 'proof';
  return { Assigned: 'ship', Shipped: 'handover', 'Traveler Confirmed': 'wait', Complete: 'rate' }[product.deliveryStatus] || '';
};
export const deliveryDestination = product => [...new Set(['city', 'state', 'country'].map(key => text(product?.destination?.[key])).filter(Boolean))].join(', ') || 'Destination unavailable';
export const claimAcknowledged = (response, productId) => response?.success === true && response.data?.product === productId && Boolean(text(response.data?.travelerId));
export const statusAcknowledged = (response, productId, status) => response?.success === true && response.data?.productId === productId && response.data?.deliveryStatus === status;

export const readDeliveryProof = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve({ base64: reader.result, type: file.type, size: file.size });
  reader.onerror = () => reject(new Error('This file could not be read. Please choose it again.'));
  reader.onabort = () => reject(new Error('File reading was interrupted. Please try again.'));
  reader.readAsDataURL(file);
});
