import { previewOrders } from './clientDashboardFixtures';

// Synthetic details for development previews only.
export const enrichPreviewOrder = source => ({
  ...structuredClone(source),
  paymentMethod: source.paymentMethod || 'Paystack',
  items: (source.items || []).map(item => ({
    ...structuredClone(item),
    product: item.product && typeof item.product === 'object' ? {
      productDescription: 'Please keep the item in its original packaging and protect it during the journey.',
      categoryName: 'Everyday essentials', destination: { city: 'Nairobi', state: '30', country: 'KE' },
      productDimensions: '25 × 20 × 8 cm', shippingRestrictions: 'Keep dry and handle with care.',
      ...structuredClone(item.product),
    } : item.product,
  })),
});

export const previewDetailedOrder = enrichPreviewOrder({
  ...previewOrders[0], totalAmount: 21750,
  items: [previewOrders[0].items[0], previewOrders[1].items[0]],
});
