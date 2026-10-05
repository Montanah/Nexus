import { loadedResource } from '../components/overviewModel';

export const orderPreviewUsers = [
  { _id: 'order-client-a', name: 'Amara Wanjiku' },
  { _id: 'order-client-b', name: 'Daniel Otieno' },
  { _id: 'order-traveler-user-a', name: 'Nia Hassan' },
  { _id: 'order-traveler-user-b', name: 'Leo Maina' },
];
export const orderPreviewTravelers = [
  { _id: 'order-traveler-a', userId: 'order-traveler-user-a' },
  { _id: 'order-traveler-b', userId: 'order-traveler-user-b' },
];
export const orderPreviewProducts = [
  {
    _id: 'order-product-a',
    productName: 'Wireless headphones',
    quantity: 99,
    destination: { city: 'Nairobi', country: 'Kenya' },
    deliverydate: '2026-10-12T12:00:00Z',
  },
  {
    _id: 'order-product-b',
    productName: 'Everyday backpack',
    quantity: 88,
    destination: { city: 'Mombasa', country: 'Kenya' },
    deliverydate: '2026-10-15T12:00:00Z',
  },
];
export const orderPreviewRecords = Array.from({ length: 14 }, (_, index) => ({
  _id: `sample-delivery-order-${index + 1}`,
  orderNumber: `ORD-20261005-${String(1014 - index).padStart(4, '0')}`,
  userId: index % 2 ? 'order-client-b' : 'order-client-a',
  createdAt: `2026-09-${String(28 - index).padStart(2, '0')}T12:00:00Z`,
  totalAmount: index === 0 ? 4600 : (index + 1) * 1150,
  paymentStatus: ['Paid', 'Pending', 'Failed'][index % 3],
  paymentMethod: ['Mpesa', 'Stripe'][index % 2],
  deliveryStatus: 'Pending',
  items:
    index === 13
      ? undefined
      : [
          {
            product: 'order-product-a',
            quantity: index === 0 ? 2 : 1,
            claimedBy: index % 3 === 0 ? null : 'order-traveler-a',
            deliveryStatus: [
              'Pending',
              'Assigned',
              'Shipped',
              'Delivered',
              'Client Confirmed',
              'Traveler Confirmed',
              'Complete',
              'Cancelled',
            ][index % 8],
            deliveryProof: null,
          },
          ...(index === 0
            ? [
                {
                  product: 'order-product-b',
                  quantity: 1,
                  claimedBy: 'order-traveler-b',
                  deliveryStatus: 'Shipped',
                  deliveryProof: null,
                },
              ]
            : []),
        ],
}));
export const orderScenarios = {
  sample: 'Sample orders',
  empty: 'Empty directory',
  loading: 'Loading orders',
  failed: 'Orders request failed',
  stale: 'Orders refresh failed',
  lookups: 'Related details failed',
  restricted: 'Orders-only access',
  denied: 'Order access revoked',
  'detail-failed': 'Details request failed',
  'detail-missing': 'Order not found',
  'detail-stale': 'Details refresh failed',
  'detail-incomplete': 'Incomplete order data',
};
export const orderPreviewResources = (scenario) => {
  const resources = {
    users: loadedResource(orderPreviewUsers),
    travelers: loadedResource(orderPreviewTravelers),
    products: loadedResource(orderPreviewProducts),
    orders: loadedResource(scenario === 'empty' ? [] : orderPreviewRecords),
  };
  if (['loading', 'failed', 'denied'].includes(scenario))
    resources.orders = {
      data: null,
      status: { loading: 'loading', failed: 'error', denied: 'restricted' }[
        scenario
      ],
    };
  if (scenario === 'stale') resources.orders.status = 'error';
  if (scenario === 'lookups' || scenario === 'restricted')
    for (const key of ['users', 'travelers', 'products'])
      resources[key] = {
        data: null,
        status: scenario === 'restricted' ? 'restricted' : 'error',
      };
  return resources;
};
