import { getItems, getItemStatus, getProductId } from './clientDashboardModel.js';

export const ratingLabels = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
export const resolveRatingRole = (search, state, profile) => {
  const requested = new URLSearchParams(search).get('as');
  if (requested !== null) return ['client', 'traveler'].includes(requested) ? requested : '';
  if (typeof state?.isTraveler === 'boolean') return state.isTraveler ? 'traveler' : 'client';
  return ['client', 'traveler'].includes(profile?.role) ? profile.role : '';
};
const text = value => typeof value === 'string' ? value.trim() : '';
const productDetails = product => ({
  name: text(product?.productName) || 'Product details unavailable',
  category: text(product?.categoryName) || 'Your delivery',
  photo: Array.isArray(product?.productPhotos) ? product.productPhotos.find(photo => typeof photo === 'string' && photo) : '',
});

export const clientRatingContext = (orders, productId) => {
  if (!Array.isArray(orders)) throw new Error('Order details unavailable.');
  if (!productId) return null;
  for (const order of orders) {
    const item = getItems(order).find(item => getProductId(item) === productId);
    if (!item) continue;
    const status = order.deliveryStatus === 'Cancelled' ? 'Cancelled' : getItemStatus(item);
    return {
      ...productDetails(item.product), productId, orderNumber: text(order.orderNumber),
      person: text(item.claimedBy?.userId?.name) || 'Your traveler',
      status, existingRating: item.travelerRating, existingComment: text(item.travelerComment),
      eligible: ['Client Confirmed', 'Delivered'].includes(status) && Boolean(item.claimedBy),
    };
  }
  return null;
};

export const travelerRatingContext = (products, productId) => {
  if (!Array.isArray(products)) throw new Error('Delivery details unavailable.');
  const product = productId && products.find(product => product?._id === productId);
  if (!product) return null;
  return {
    ...productDetails(product), productId, orderNumber: text(product.orderNumber),
    person: text(product.client?.name) || 'Your client', status: product.deliveryStatus,
    existingRating: product.clientRating, existingComment: text(product.clientComment),
    eligible: product.deliveryStatus === 'Complete',
  };
};

export const validateRating = (rating, comment) => {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { field: 'rating', message: 'Choose a star rating from 1 to 5.' };
  if (typeof comment !== 'string' || comment.length > 500) return { field: 'comment', message: 'Keep your comment to 500 characters or fewer.' };
  return null;
};
export const ratingPayload = (productId, rating, comment) => ({ productId, rating, comment: comment.trim() });
export const ratingSaved = (response, role) => {
  const result = response?.data?.[role === 'traveler' ? 'clientRating' : 'travelerRating'];
  return response?.success === true && Number.isInteger(result?.count) && result.count > 0
    && Number.isFinite(result?.average) && result.average >= 1 && result.average <= 5;
};
export const isAlreadyRated = error => ['You already rated for this product', 'Client already rated for this product'].includes(error?.response?.data?.data?.message);
export const ratingError = error => {
  const message = error?.response?.data?.data?.message || error?.response?.data?.message;
  return typeof message === 'string' && error?.response?.status >= 400 && error.response.status < 500
    ? message : 'We couldn’t confirm your rating was saved. Your stars and comment are still here. Please try again.';
};
