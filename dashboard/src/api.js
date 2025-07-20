import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL:  import.meta.env.REACT_APP_API_URL || '', // Set your API base URL
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const adminLogin = async (email, password) => {
  console.log("calling me");
  const response = await api.post('/api/admin/login', { email, password });
  console.log(response.data);
  return response.data;
};

export const adminLogout = async () => {
  try {
    await api.post('/api/admin/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    delete api.defaults.headers.common['Authorization'];
  }
};

export const getAdminProfile = async () => {
  const response = await api.get('/api/admin/profile');
  return response.data?.data;
};
export const fetchAdminProfile = async () => {
  try {
    console.log('Fetching admin profile...');
    const response = await api.get('/api/admin/profile');
    console.log(response.data);
    return response.data?.data?.admin;
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    throw error;
  }
};

export const updateAdminProfile = async (profileData) => {
  try {
    const response = await api.patch('/api/admin/profile', profileData);
    return response.data?.data;
  } catch (error) {
    console.error('Error updating admin profile:', error);
    throw error;
  }
};

// Admin Management APIs (Superadmin only)
export const createAdmin = async (adminData) => {
  const response = await api.post('/api/admin/create', adminData);
  return response.data?.data;
};

export const getAllAdmins = async () => {
  const response = await api.get('/api/admin/admins');
  return response.data?.admins || [];
};

export const updateAdminPermissions = async (adminId, updateData) => {
  const response = await api.put(`/api/admin/admins/${adminId}`, updateData);
  return response.data?.data;
};

export const deleteAdmin = async (adminId) => {
  const response = await api.delete(`/api/admin/admins/${adminId}`);
  return response.data?.data;
};

// Data fetching APIs
export const fetchUsers = async () => {
  try {
    const response = await api.get('/api/admin/users');
    return response.data?.data?.users || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const fetchProducts = async () => {
  try {
    const response = await api.get('/api/admin/products');
    return response.data?.data?.products || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const fetchOrders = async () => {
  try {
    const response = await api.get('/api/admin/orders');
    return response.data?.data?.orders || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

export const fetchTravelers = async () => {
  try {
    const response = await api.get('/api/admin/travelers');
    const data = response.data?.data?.travelers || response.data?.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching travelers:', error);
    throw error;
  }
};

export const fetchTransactions = async () => {
  try {
    const response = await api.get('/api/admin/transactions');
    console.log(response.data?.data);
    const data = response.data?.data?.transactions || response.data?.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

export const fetchDisputes = async () => {
  try {
    const response = await api.get('/api/admin/disputes');
    const data = response.data?.data?.disputes || response.data?.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching disputes:', error);
    throw error;
  }
};

// Individual resource APIs
export const fetchUserById = async (userId) => {
  try {
    const response = await api.get(`/api/admin/users/${userId}`);
    return response.data?.data?.user || {};
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

export const fetchProductById = async (productId) => {
  try {
    const response = await api.get(`/api/admin/products/${productId}`);
    return response.data?.data?.product || {};
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

export const fetchOrderById = async (orderId) => {
  try {
    const response = await api.get(`/api/admin/orders/${orderId}`);
    return response.data?.data?.order || {};
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

// Export transactions
export const exportTransactions = async () => {
  try {
    const response = await api.get('/api/admin/export/transactions', {
      responseType: 'blob', // Important for file downloads
    });
    
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Get filename from response headers if available
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'transactions.csv';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: 'Export completed successfully' };
  } catch (error) {
    console.error('Error exporting transactions:', error);
    throw error;
  }
};

// Utility function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('adminToken');
  const adminData = localStorage.getItem('adminData');
  return !!(token && adminData);
};

// Utility function to get current admin data
// api.js (partial update)
export const getCurrentAdmin = () => {
  const adminData = localStorage.getItem('adminData');
  // console.log('Current admin data:', adminData);
  if (!adminData) return null; // Return null if no data
  try {
    return JSON.parse(adminData);
  } catch (error) {
    console.error('Invalid admin data in localStorage:', error);
    localStorage.removeItem('adminData'); // Clear invalid data
    return null;
  }
};

// Utility function to check admin permissions
export const hasPermission = (permission) => {
  const admin = getCurrentAdmin();
  if (!admin) return false;
  
  return admin.permissions.includes('all') || admin.permissions.includes(permission);
};

// Utility function to check if admin is superadmin
export const isSuperAdmin = () => {
  const admin = getCurrentAdmin();
  return admin?.role === 'superadmin';
};

// Initialize auth on app load
export const initializeAuth = () => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// fetchall
export const fetchAllAdmins = async () => {
  try {
    const response = await api.get('/api/admin/admins');
    const data = response.data?.data?.admins || response.data?.data?.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching admins:', error);
    throw error;
  }
};

// fetch payments
export const fetchPayments = async () => {
  try {
    const response = await api.get('/api/admin/payments');
    const data = response.data?.data?.payments || response.data?.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
};

export const processPayment = async (paymentData) => {
  try {
    const response = await api.post('/api/admin/pay', paymentData);
    return response.data;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};

export const releaseFunds = async (paymentId, travelerId) => {
  try {
    const response = await api.post('/api/admin/release', { paymentId, travelerId });
    return response.data;
  } catch (error) {
    console.error('Error releasing funds:', error);
    throw error;
  }
};

export const getUserDetails = async (userId) => {
  try {
    const response = await api.get(`/api/admin/user/${userId}`);
    //console.log(response.data?.data);
    return response.data?.data || {};
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

export const getTravelerDetails = async (travelerId) => {
  try {
    const response = await api.get(`/api/admin/traveler/${travelerId}`);
    //console.log(response.data?.data);
    return response.data?.data || {};
  } catch (error) {
    console.error('Error fetching traveler details:', error);
    throw error;
  }
};

// Call this when your app starts
initializeAuth();

export default api;