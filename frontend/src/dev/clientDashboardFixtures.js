// Synthetic development data. Imported only by the development preview route.
export const previewUser = { name: 'Alex Morgan', email: 'alex@example.test' };

const item = (id, name, amount, status, deliverydate, traveler, extra = {}) => ({
  product: { _id: `preview-product-${id}`, productName: name, totalPrice: amount, productPhotos: [], deliverydate },
  quantity: 1,
  deliveryStatus: status,
  claimedBy: traveler ? { userId: { name: traveler } } : null,
  ...extra,
});

export const previewOrders = [
  { _id: 'preview-order-1', orderNumber: 'ORD-1026-0018', createdAt: '2026-10-02T08:00:00Z', totalAmount: 14950, paymentStatus: 'Paid', deliveryStatus: 'Pending', items: [item(1, 'Noise-canceling headphones', 14950, 'Shipped', '2026-10-06T12:00:00Z', 'Jordan Lee')] },
  { _id: 'preview-order-2', orderNumber: 'ORD-1026-0017', createdAt: '2026-10-01T08:00:00Z', totalAmount: 6800, paymentStatus: 'Paid', deliveryStatus: 'Pending', items: [item(2, 'Everyday backpack', 6800, 'Traveler Confirmed', '2026-10-03T12:00:00Z', 'Sam Taylor')] },
  { _id: 'preview-order-3', orderNumber: 'ORD-0926-0016', createdAt: '2026-09-29T08:00:00Z', totalAmount: 11500, paymentStatus: 'Paid', deliveryStatus: 'Pending', items: [item(3, 'Running trainers', 11500, 'Assigned', '2026-10-08T12:00:00Z', 'Chris Kim')] },
  { _id: 'preview-order-4', orderNumber: 'ORD-0926-0015', createdAt: '2026-09-26T08:00:00Z', totalAmount: 4850, paymentStatus: 'Paid', deliveryStatus: 'Pending', items: [item(4, 'Leather wallet', 4850, 'Complete', '2026-09-30T12:00:00Z', 'Sam Taylor', { travelerRating: 5 })] },
  { _id: 'preview-order-5', orderNumber: 'ORD-0926-0014', createdAt: '2026-09-24T08:00:00Z', totalAmount: 12800, paymentStatus: 'Paid', deliveryStatus: 'Pending', items: [item(5, 'Travel essentials set', 7900, 'Pending', '2026-10-10T12:00:00Z'), item(6, 'Portable power bank', 4900, 'Pending', '2026-10-10T12:00:00Z')] },
];
