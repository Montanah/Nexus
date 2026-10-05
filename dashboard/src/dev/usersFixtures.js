import { loadedResource } from '../components/overviewModel';

const names = [
  'Amara Wanjiku',
  'Daniel Otieno',
  'Grace Kamau',
  'Liam Mwangi',
  'Nia Hassan',
  'Noah Kimani',
  'Zuri Achieng',
  'Ethan Kariuki',
  'Maya Njeri',
  'Leo Maina',
  'Ava Wambui',
  'Isaac Ouma',
  'Imani Barasa',
  'Adam Kiptoo',
  'Sofia Mutua',
  'Lucas Wekesa',
  'Ella Chebet',
];
export const usersPreviewRecords = names
  .map((name, index) => ({
    _id: `sample-account-${String(index + 1).padStart(2, '0')}`,
    name,
    email: `${name.toLowerCase().replace(' ', '.')}@example.test`,
    phone_number: index % 3 ? null : '+254 700 000 000',
    role: [
      'client',
      'traveler',
      'client',
      'user',
      'traveler',
      'admin',
      'superAdmin',
    ][index % 7],
    isVerified: index % 3 !== 0,
    is2FAEnabled: index % 4 === 0,
    createdAt: `2026-09-${String(28 - index).padStart(2, '0')}T09:00:00Z`,
    updatedAt: '2026-10-01T10:00:00Z',
  }))
  .concat({
    _id: 'sample-account-incomplete',
    role: 'future-role',
    isVerified: null,
    createdAt: 'invalid-date',
  });
export const previewUserDetails = (userId) => {
  const user = usersPreviewRecords.find((record) => record._id === userId);
  return user
    ? {
        user,
        orders:
          userId === usersPreviewRecords[0]._id
            ? ['Pending', 'Complete', 'Shipped'].map((stage, index) => ({
                _id: `sample-profile-order-${index}`,
                orderNumber: `NX-20${index + 1}`,
                createdAt: `2026-10-0${3 - index}T12:00:00Z`,
                items: [{ deliveryStatus: stage }],
                deliveryStatus: 'Pending',
              }))
            : [],
        payments:
          userId === usersPreviewRecords[0]._id
            ? [
                {
                  _id: 'sample-payment-log-1',
                  paymentLogsId: 'PAY-EXAMPLE-001',
                  orderNumber: 'NX-202',
                  paymentMethod: 'Mpesa',
                  amount: 2400,
                  status: 'Paid',
                  createdAt: '2026-10-02T12:00:00Z',
                },
                {
                  _id: 'sample-payment-log-2',
                  paymentLogsId: 'PAY-EXAMPLE-002',
                  orderNumber: 'NX-203',
                  amount: 0,
                  status: 'Pending',
                },
              ]
            : [],
      }
    : null;
};
export const userScenarios = {
  sample: 'Sample accounts',
  empty: 'Empty directory',
  loading: 'Loading users',
  failed: 'Users request failed',
  stale: 'Users refresh failed',
  restricted: 'No user access',
  'profile-failed': 'Profile request failed',
  'profile-missing': 'User not found',
  'profile-restricted': 'Profile access revoked',
  'profile-incomplete': 'Incomplete profile history',
};
export const usersResource = (scenario) => {
  if (scenario === 'loading') return { data: null, status: 'loading' };
  if (scenario === 'failed') return { data: null, status: 'error' };
  if (scenario === 'restricted') return { data: null, status: 'restricted' };
  const resource = loadedResource(
    scenario === 'empty' ? [] : usersPreviewRecords,
  );
  return scenario === 'stale' ? { ...resource, status: 'error' } : resource;
};
