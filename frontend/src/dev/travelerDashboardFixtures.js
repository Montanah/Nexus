// Synthetic development data, excluded with the development-only preview route.
export const previewTraveler = { name: 'Jordan Lee', email: 'jordan@example.test' };
export const previewEarnings = { totalEarnings: 18450, pendingPayments: 2700, rating: { average: 4.9, count: 24 } };

const product = (id, productName, categoryName, city, totalPrice, rewardAmount, deliverydate, extra = {}) => ({
  _id: `traveler-preview-${id}`, productName, categoryName,
  destination: { city, state: city, country: 'Kenya' }, totalPrice, rewardAmount,
  productMarkup: rewardAmount * 3, deliverydate, createdAt: '2026-10-02T08:00:00Z',
  quantity: 1, productPhotos: [], deliveryStatus: 'Pending', claimedBy: null,
  urgencyLevel: 'medium', productDescription: 'Please keep the item in its original packaging and arrange a convenient handover with the client.',
  ...extra,
});

export const previewAvailable = [
  product('camera', 'Compact digital camera', 'Electronics', 'Nairobi', 34500, 1550, '2026-10-06T12:00:00Z', { urgencyLevel: 'high', productWeight: 0.45, productDimensions: '12 × 8 × 6 cm', shippingRestrictions: 'Fragile item. Keep protected from impact and moisture.' }),
  product('sneakers', 'Everyday sneakers', 'Fashion', 'Mombasa', 12500, 650, '2026-10-08T12:00:00Z', { productWeight: 0.8 }),
  product('headphones', 'Wireless headphones', 'Electronics', 'Kisumu', 18900, 950, '2026-10-09T12:00:00Z', { urgencyLevel: 'low', productWeight: 0.35 }),
  product('skincare', 'Skincare essentials', 'Beauty', 'Nairobi', 8400, 480, '2026-10-10T12:00:00Z', { quantity: 3, shippingRestrictions: 'Check the carrier’s rules for liquids before accepting.' }),
  product('backpack', 'Weekend backpack', 'Accessories', 'Nakuru', 7200, 420, '2026-10-12T12:00:00Z', { urgencyLevel: 'low' }),
  product('books', 'A reader’s collection', 'Books', 'Kampala', 5800, 520, '2026-10-14T12:00:00Z', { destination: { country: 'Uganda', state: 'Central', city: 'Kampala' }, quantity: 4 }),
];

export const previewDeliveries = [
  product('watch', 'Classic wristwatch', 'Accessories', 'Nairobi', 21000, 1100, '2026-10-04T12:00:00Z', { deliveryStatus: 'Assigned', claimedBy: 'preview-traveler' }),
  product('speaker', 'Portable speaker', 'Electronics', 'Mombasa', 9800, 580, '2026-10-05T12:00:00Z', { deliveryStatus: 'Shipped', claimedBy: 'preview-traveler' }),
  product('jacket', 'Lightweight jacket', 'Fashion', 'Nairobi', 6800, 390, '2026-10-03T12:00:00Z', { deliveryStatus: 'Traveler Confirmed', claimedBy: 'preview-traveler' }),
  product('wallet', 'Leather cardholder', 'Accessories', 'Nakuru', 4200, 260, '2026-10-02T12:00:00Z', { deliveryStatus: 'Client Confirmed', claimedBy: 'preview-traveler' }),
  product('bag', 'Canvas tote bag', 'Accessories', 'Nairobi', 3500, 220, '2026-09-29T12:00:00Z', { deliveryStatus: 'Complete', claimedBy: 'preview-traveler', clientRating: 5 }),
];
