const numeric = value => value === '' || value == null || !Number.isFinite(Number(value)) ? null : Number(value);
const round = value => Math.round((value + Number.EPSILON) * 100) / 100;

export const normalizeCart = items => Array.isArray(items) ? items.filter(item => item && typeof item === 'object').map((item, index) => ({
  ...item,
  rowId: item.productId || `unavailable-${index}`,
  productId: typeof item.productId === 'string' ? item.productId : '',
  productName: item.productName || 'Unavailable item',
  quantity: numeric(item.quantity), productFee: numeric(item.productFee), finalCharge: numeric(item.finalCharge),
  productPhotos: Array.isArray(item.productPhotos) ? item.productPhotos : [],
})) : [];

export const isCartItemValid = item => Boolean(item.productId)
  && Number.isSafeInteger(item.quantity) && item.quantity > 0
  && item.productFee !== null && item.productFee > 0
  && item.finalCharge !== null && item.finalCharge > 0;

export const cartTotals = items => {
  const quantity = items.reduce((sum, item) => sum + (Number.isSafeInteger(item.quantity) && item.quantity > 0 ? item.quantity : 0), 0);
  if (items.some(item => !isCartItemValid(item))) return { quantity, subtotal: null, fee: null, total: null, canCheckout: false };
  const subtotal = round(items.reduce((sum, item) => sum + item.productFee * item.quantity, 0));
  // finalCharge already includes the fee. Match checkout by adding the API's
  // unrounded line totals, then rounding once; never apply the fee a second time.
  const total = round(items.reduce((sum, item) => sum + item.finalCharge, 0));
  return { quantity, subtotal, fee: round(total - subtotal), total, canCheckout: items.length > 0 };
};

export const removeCartItem = (items, productId) => items.filter(item => item.productId !== productId);
