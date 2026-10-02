export const emptyOrderForm = {
  productName: '', quantity: '1', productDescription: '', productCategory: '', customCategory: '',
  photos: [], weight: '', dimensions: '', country: '', state: '', city: '', deliveryDate: '',
  shippingRestrictions: '', productPrice: '', urgencyLevel: 'medium',
};

export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const round = value => Math.round((value + Number.EPSILON) * 100) / 100;

export const estimateOrder = (price, quantity) => {
  const unitPrice = Number(price);
  const count = Number(quantity);
  if (!Number.isFinite(unitPrice) || unitPrice < 0.01 || round(unitPrice) !== unitPrice || !Number.isSafeInteger(count) || count < 1 || unitPrice * count > Number.MAX_SAFE_INTEGER / 100) return null;
  const subtotal = round(unitPrice * count);
  const total = round(subtotal * 1.15);
  return { subtotal, serviceFee: round(total - subtotal), total };
};

export const validateOrder = (form, { today = localDate(), original = null } = {}) => {
  const errors = {};
  if (!form.productName.trim()) errors.productName = 'Enter a product name.';
  if (!Number.isSafeInteger(Number(form.quantity)) || Number(form.quantity) < 1) errors.quantity = 'Enter a whole quantity of at least 1.';
  if (!form.productDescription.trim()) errors.productDescription = 'Describe the product so your traveler knows what to bring.';
  if (!form.productCategory) errors.productCategory = 'Choose a category.';
  if (form.productCategory === 'custom' && !form.customCategory.trim()) errors.customCategory = 'Enter a name for your new category.';
  if (!form.country) errors.country = 'Choose a destination country.';
  if (!form.state.trim()) errors.state = 'Enter or choose a state or region.';
  if (!form.city.trim()) errors.city = 'Enter the destination city.';
  const parsed = new Date(`${form.deliveryDate}T12:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.deliveryDate) || Number.isNaN(parsed.getTime()) || localDate(parsed) !== form.deliveryDate) errors.deliveryDate = 'Choose a valid arrival date.';
  else if (form.deliveryDate < today && form.deliveryDate !== original?.deliveryDate) errors.deliveryDate = 'Choose today or a future arrival date.';
  if (!estimateOrder(form.productPrice, form.quantity)) errors.productPrice = 'Enter a price of at least KES 0.01, with up to 2 decimal places, and a valid quantity.';
  if (form.weight !== '' && (!Number.isFinite(Number(form.weight)) || Number(form.weight) <= 0)) errors.weight = 'Enter a weight greater than zero, or leave it blank.';
  if (!['low', 'medium', 'high'].includes(form.urgencyLevel)) errors.urgencyLevel = 'Choose a delivery priority.';
  // The current update endpoint preserves optional values when sent as empty.
  for (const key of ['weight', 'dimensions', 'shippingRestrictions']) {
    if (original?.[key] && !String(form[key]).trim()) errors[key] = 'This saved detail can be replaced, but cannot be cleared yet.';
  }
  return errors;
};

export const orderPayload = (form, categoryId = form.productCategory) => ({
  productName: form.productName.trim(), quantity: Number(form.quantity),
  productDescription: form.productDescription.trim(), productCategory: categoryId,
  productPhotos: form.photos.map(photo => photo.base64),
  productWeight: form.weight === '' ? null : Number(form.weight),
  productDimensions: form.dimensions.trim() || null,
  destination: { country: form.country, state: form.state.trim(), city: form.city.trim() },
  deliverydate: form.deliveryDate, shippingRestrictions: form.shippingRestrictions.trim(),
  productFee: Number(form.productPrice), urgencyLevel: form.urgencyLevel,
});

export const formFromProduct = (product, cartItem = {}) => ({
  ...emptyOrderForm,
  productName: product.productName || '', quantity: String(cartItem.quantity ?? product.quantity ?? 1),
  productDescription: product.productDescription || '',
  productCategory: typeof product.productCategory === 'object' ? product.productCategory?._id || '' : product.productCategory || '',
  productCategoryName: product.productCategory?.categoryName || product.categoryName || '',
  photos: (product.productPhotos || []).map((base64, index) => ({ id: `existing-${index}`, name: `Product photo ${index + 1}`, base64 })),
  weight: product.productWeight == null ? '' : String(product.productWeight), dimensions: product.productDimensions || '',
  country: product.destination?.country || '', state: product.destination?.state || '', city: product.destination?.city || '',
  deliveryDate: product.deliverydate?.slice(0, 10) || '', shippingRestrictions: product.shippingRestrictions || '',
  productPrice: product.productFee == null ? '' : String(product.productFee), urgencyLevel: product.urgencyLevel || 'medium',
});

export const validateOrderPhoto = file => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Choose JPG, PNG, or WebP photos.';
  if (!file.size) return 'This photo is empty. Choose another file.';
  if (file.size > 5 * 1024 * 1024) return 'Each photo must be 5 MB or smaller.';
  return '';
};

export const apiErrorMessage = (error, fallback) => {
  const data = error.response?.data?.data;
  return typeof data === 'string' ? data : data?.message || error.response?.data?.message || error.message || fallback;
};
