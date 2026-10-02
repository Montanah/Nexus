export const emptyFilters = { category: '', country: '', state: '', city: '', urgency: '', priceMin: '', priceMax: '' };

const numberOrNull = value => value === '' || value == null || !Number.isFinite(Number(value)) ? null : Number(value);

export const normalizeProduct = product => ({
  ...product,
  productId: product._id,
  productName: product.productName || 'Product details unavailable',
  destination: product.destination || {},
  categoryName: product.categoryName || 'Uncategorized',
  urgencyLevel: String(product.urgencyLevel || 'medium').toLowerCase(),
  // Markup includes platform fees; only rewardAmount belongs to the traveler.
  rewardAmount: numberOrNull(product.rewardAmount),
  productPrice: numberOrNull(product.totalPrice),
  deliveryStatus: product.deliveryStatus || 'Pending',
});

export const normalizeProducts = products => Array.isArray(products)
  ? products.filter(product => product && typeof product === 'object' && product._id).map(normalizeProduct)
  : [];

export const statusLabels = {
  Pending: 'Available', Assigned: 'Ready to ship', Shipped: 'On the way',
  'Traveler Confirmed': 'Awaiting client', 'Client Confirmed': 'Proof needed',
  Complete: 'Completed', Delivered: 'Delivered', Cancelled: 'Cancelled',
};
export const isFinished = product => ['Complete', 'Delivered'].includes(product.deliveryStatus);
export const isActive = product => !isFinished(product) && product.deliveryStatus !== 'Cancelled';
export const isAvailable = product => !product.claimedBy && product.deliveryStatus === 'Pending';
export const nextStatus = product => product.proofUploaded && product.deliveryStatus === 'Client Confirmed' ? 'Complete'
  : ({ Assigned: 'Shipped', Shipped: 'Traveler Confirmed' }[product.deliveryStatus] || null);

export const matchesDelivery = (product, filter) => filter === 'active' ? isActive(product)
  : filter === 'proof' ? product.deliveryStatus === 'Client Confirmed'
    : filter === 'complete' ? isFinished(product) : true;

export const filterProducts = (products, { query = '', filters = emptyFilters, sort = 'soonest' } = {}) => {
  const search = query.trim().toLowerCase();
  return products.filter(product => {
    const destination = product.destination || {};
    return [product.productName, product.categoryName, product.orderNumber, ...Object.values(destination)].join(' ').toLowerCase().includes(search)
      && (!filters.category || product.categoryName === filters.category)
      && ['country', 'state', 'city'].every(key => !filters[key] || destination[key] === filters[key])
      && (!filters.urgency || product.urgencyLevel === filters.urgency)
      && (filters.priceMin === '' || (product.productPrice !== null && product.productPrice >= Number(filters.priceMin)))
      && (filters.priceMax === '' || (product.productPrice !== null && product.productPrice <= Number(filters.priceMax)));
  }).sort((a, b) => {
    if (sort === 'reward') return (b.rewardAmount ?? -Infinity) - (a.rewardAmount ?? -Infinity);
    if (sort === 'newest') return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
    return (Date.parse(a.deliverydate) || Infinity) - (Date.parse(b.deliverydate) || Infinity);
  });
};

export const validateProofFile = file => {
  if (!file) return 'Choose a delivery proof file first.';
  if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) return 'Choose a JPG, PNG, or PDF file.';
  if (!file.size) return 'This file is empty. Please choose another file.';
  if (file.size > 5 * 1024 * 1024) return 'Choose a file smaller than 5 MB.';
  return '';
};
