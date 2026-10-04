import {
  failedResource,
  initialResources,
  loadedResource,
  resourceKeys,
} from '../components/overviewModel';

export const previewAdmin = {
  _id: 'preview-admin',
  name: 'Alex Morgan',
  email: 'alex@example.test',
  role: 'superadmin',
  permissions: ['all'],
};
export const previewRecords = {
  users: Array.from({ length: 24 }, (_, index) => ({
    _id: `sample-user-${index}`,
  })),
  products: Array.from({ length: 18 }, (_, index) => ({
    _id: `sample-product-${index}`,
  })),
  travelers: Array.from({ length: 8 }, (_, index) => ({
    _id: `sample-traveler-${index}`,
  })),
  orders: [
    'Pending',
    'Assigned',
    'Complete',
    'Shipped',
    'Cancelled',
    'Delivered',
  ].map((stage, index) => ({
    _id: `sample-order-${index}`,
    orderNumber: `NX-102${6 - index}`,
    createdAt: `2026-10-0${5 - Math.floor(index / 2)}T${String(14 - index).padStart(2, '0')}:30:00Z`,
    deliveryStatus: stage,
    items: [
      { deliveryStatus: stage },
      ...(index % 2 ? [] : [{ deliveryStatus: stage }]),
    ],
  })),
};
export const scenarios = {
  sample: 'Sample data',
  empty: 'Empty platform',
  loading: 'Loading',
  partial: 'Partial failure',
  failed: 'All requests failed',
  stale: 'Refresh failed',
  restricted: 'Orders-only access',
  denied: 'Access revoked',
};
export const adminForScenario = (scenario) =>
  scenario === 'restricted'
    ? { ...previewAdmin, role: 'admin', permissions: ['orders.read'] }
    : previewAdmin;
export const resourcesForScenario = (scenario) => {
  const resources = initialResources(adminForScenario(scenario));
  for (const key of resourceKeys) {
    if (resources[key].status === 'restricted' || scenario === 'loading')
      continue;
    resources[key] = loadedResource(
      scenario === 'empty' ? [] : previewRecords[key],
    );
    if (scenario === 'failed' || (scenario === 'partial' && key === 'users'))
      resources[key] = failedResource(
        { data: null, updatedAt: null },
        new Error(),
      );
    if (scenario === 'stale' && key === 'orders')
      resources[key] = failedResource(resources[key], new Error());
    if (scenario === 'denied')
      resources[key] = failedResource(resources[key], {
        response: { status: 403 },
      });
  }
  return resources;
};
