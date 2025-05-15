import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_KEY || 'http://localhost:3001',
  withCredentials: true, 
});

let isRefreshing = false;

// Request Interceptor: Skip adding headers for public endpoints
api.interceptors.request.use((config) => {
  const publicEndpoints = [
    '/api/auth/loginUser',
    '/api/auth/register',
    '/api/auth/refresh-token',
    '/api/auth/verifyUser',
    '/api/auth/resendVerificationCode',
    '/api/auth/forgotPassword',
    '/api/auth/resetPassword',
  ];

  if (publicEndpoints.some(endpoint => config.url.includes(endpoint))) {
    return config;
  }

  return config;
});

// Response Interceptor: Handle 401 errors with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          console.log('Attempting to refresh token...');
          const response = await api.post('/api/auth/refresh-token');
          console.log('Token refresh successful:', response.data);
          isRefreshing = false;
          console.log('Retrying original request:', originalRequest.url);
          return api(originalRequest); 
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          isRefreshing = false;
          if (typeof window !== 'undefined') {
            window.location.href = '/login'; 
            return new Promise(() => {}); 
          }
          return Promise.reject(refreshError); 
        }
      } else {
        console.log('Token refresh in progress...');
        return new Promise((resolve) => {
          const checkRefresh = setInterval(() => {
            if (!isRefreshing) {
              clearInterval(checkRefresh);
              console.log('Retrying original request:', originalRequest.url);
              resolve(api(originalRequest));
            }
          }, 100);
        });
      }
    }

    return Promise.reject(error);
  }
);

// AUTH ENDPOINTS
// Fetch user data based on userId (Protected)
export const fetchUserData = async (userId) => {
  const response = await api.get(`/api/auth/user/${userId}`);
  return response.data;
};

// Signup (Public)
export const signup = async (userData) => {
  const response = await api.post('/api/auth/register', userData);
  return response.data;
};

// Verify user (Public)
export const verifyUser = async (verificationData) => {
  const response = await api.post('/api/auth/verifyUser', verificationData);
  return response.data;
};

// Resend verification code (Public)
export const resendVerificationCode = async (email) => {
  const response = await api.post('/api/auth/resendVerificationCode', { email });
  return response.data;
};

// Login (Public)
export const loginUser = async (credentials) => {
  const response = await api.post('/api/auth/loginUser', credentials);
  return response.data;
};

// Verify OTP (Public-ish, but typically after login initiation)
export const verifyLoginOTP = async (otpData) => {
  const response = await api.post('/api/auth/verifyLoginOTP', otpData);
  return response.data;
};

// Forgot password (Public)
export const forgotPassword = async (email) => {
  const response = await api.post('/api/auth/forgotPassword', { email });
  return response.data;
};

// Reset password (Public)
export const resetPassword = async (token, newPassword) => {
  const response = await api.post('/api/auth/resetPassword', { token, password: newPassword });
  return response.data;
};

// Fetch user data (Protected, duplicate of fetchUserData, updated to remove token)
export const fetchUser = async (userId) => {
  const response = await api.get(`/api/auth/user/${userId}`);
  return response.data;
};

// Logout (Protected)
export const logoutUser = async () => {
  const response = await api.post('/api/auth/logout', {});
  return response.data;
};

// Social Authentication
export const initiateSocialLogin = async (provider, role) => {
  try {
    const response = await api.get(`/api/auth/${provider}?state=${role}`);
    if (response.data && response.data.url) {
      window.location.href = response.data.url;
    } else {
      throw new Error('Failed to get social login URL');
    }
  } catch (error) {
    console.error(`Error initiating ${provider} login:`, error);
    throw error;
  }
};

export const handleSocialCallback = async (provider, code) => {
  try {
    const response = await api.post(`/api/auth/${provider}/callback`, { code });
    return response.data;
  } catch (error) {
    console.error(`Error handling ${provider} callback:`, error);
    throw error;
  }
};

export const verifySocialUser = async ({ email, code, provider }) => {
  try {
    const response = await api.post('/api/auth/verify-social', {
      email,
      code,
      provider
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying social user:', error);
    throw error;
  }
};

// PRODUCT AND CART ENDPOINTS
// Category API call (Public or Protected depending on backend)
export const getCategories = async () => {
  const response = await api.get('/api/products/category');
  return response;
};

// Create product and add to cart (Protected)
export const createProduct = async (formData) => {
  try {
    const response = await api.post('/api/products/', formData);
    return response.data;
  } catch (error) {
    console.error('createProduct error:', error.response?.data || error);
    throw new Error(error.response?.data?.message || 'Failed to create product');
  }
};

// Create a new category (Protected)
export const createCategory = async (formData) => {
  const response = await api.post('/api/products/category/', formData);
  return response.data;
};

// Product photo upload (Protected)
export const uploadProductPhotos = async (formData) => {
  const response = await api.post('/api/products/photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Update product in cart (Protected)
export const updateProduct = async (userId, productId, formData) => {
  const response = await api.put(`/api/cart/${userId}/${productId}`, formData);
  return response.data;
};

// Fetch cart items for a user (Protected)
export const fetchCart = async (userId) => {
  const response = await api.get(`/api/cart/${userId}`);
  return response.data.items || [];
};

// Delete cart item (Protected)
export const deleteCartItem = async (userId, productId) => {
  const response = await api.delete(`/api/cart/${userId}/${productId}`);
  return response.data;
};

// Fetch orders for a specific client (Protected)
export const fetchOrders = async () => {
  const response = await api.get(`/api/orders/`);
  return response.data; // e.g., [{ id, itemName, photo, quantity, unitPrice, totalPrice, details, ... }]
};

// PRODUCT ENDPOINTS FOR TRAVELERS
// Retrieve all products (Public or Protected)
export const getAvailableProducts = async (filters) => {
  try {
    const response = await api.post('/api/products/search/', filters);
    return response.data.data; // Returns { message, products, pagination, filters }
  } catch (error) {
    console.error('Error fetching available products:', error);
    throw error;
  }
};

// Retrieve a specific product (Public or Protected)
export const getProductDetails = async (productId) => {
  try {
    const response = await api.post('/products/search/', { id: productId });
    if (response.data.products && response.data.products.length > 0) {
      return response.data.products[0]; // Return the first (and only) product
    }
    throw new Error('Product not found');
  } catch (error) {
    console.error('Error fetching product details:', error);
    throw error;
  }
};

// Search products with filters and keywords
export const searchProducts = async (searchQuery, filters = {}) => {
  try {
    const payload = { ...filters, search: searchQuery };
    const response = await api.post('/products/search/', payload);
    return response.data; // Returns { message, products, pagination, filters }
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

// Save product listing (Protected)
export const saveProduct = async (formData) => {
  const response = await api.post('/products', formData);
  return response.data;
};

// Update a product/order (Protected)
export const updateProductDetails = async (productId, formData) => {
  const response = await api.put(`/products/${productId}`, formData);
  return response.data;
};

// Delete a product/order (Protected)
export const deleteProduct = async (productId) => {
  const response = await api.delete(`/api/products/${productId}`);
  return response.data;
};

// Checkout (Protected)
export const checkout = async () => {
  const response = await api.post('/api/cart/checkout');
  return response.data;
};

// PAYMENT ENDPOINTS
// Initiate M-Pesa payment (Protected)
export const initiateMpesaMobilePayment = async (userId, cartItems, total) => {
  const response = await api.post('/mpesa-payment', { userId, cartItems, total });
  return response.data;
};

// Initiate Airtel payment (Protected)
export const initiateAirtelMobilePayment = async (userId, cartItems, total) => {
  const response = await api.post('/airtel-payment', { userId, cartItems, total });
  return response.data;
};

// Fetch payment details (Protected)
export const fetchPaymentDetails = async (sessionId) => {
  const response = await api.get(`/payment-details/${sessionId}`);
  return response.data;
};

// Create Stripe checkout session (Protected)
export const createCheckoutSession = async (userId, cartItems, total, voucherCode) => {
  const response = await api.post('/create-checkout-session', {
    userId,
    cartItems,
    total,
    voucherCode,
    successUrl: `${window.location.origin}/payment-success`,
    cancelUrl: `${window.location.origin}/checkout`,
  });
  return response.data;
};

// TRAVELER DASHBOARD ENDPOINTS
// Get traveler orders (Protected)
export const getTravelerOrders = async (filters) => {
  const response = await api.get('/travelers/orders', { params: filters });
  return response;
};

// Get traveler earnings (Protected)
export const getTravelerEarnings = async (userId, params = {}) => {
  const response = await api.get(`/travelers/${userId}/earnings`, { params });
  return response;
};

// Get traveler history (Protected)
export const getTravelerHistory = async (userId) => {
  const response = await api.get(`/travelers/${userId}/history`);
  return response;
};

// Assign fulfillment to traveler (Protected)
export const assignFulfillment = async (productId, userId) => {
  const response = await api.post('/products/assign', { productId, userId });
  return response.data;
};

// Update delivery status (Protected)
export const updateDeliveryStatus = async (deliveryId, status) => {
  const response = await api.put(`/update/${deliveryId}`, { status });
  return response.data;
};

// Upload proof of delivery (Protected)
export const uploadDeliveryProof = async (formData) => {
  const response = await api.post('/proof', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// RATING ENDPOINTS
// Rate client (Protected)
export const rateClient = async (data) => {
  const response = await api.post('/ratings/traveler-to-client', data);
  return response;
};

// Rate traveler (Protected)
export const rateTraveler = async (data) => {
  const response = await api.post('/ratings/client-to-traveler', data);
  return response;
};

// Get traveler ratings (Protected)
export const getTravelerRatings = async (userId) => {
  const response = await api.get(`/ratings/traveler/${userId}`);
  return response;
};

// Get client ratings (Protected)
export const getClientRatings = async (userId) => {
  const response = await api.get(`/ratings/client/${userId}`);
  return response;
};

// CLIENT DASHBOARD ENDPOINTS
// Get client orders (Protected)
export const getClientOrders = async (userId) => {
  const response = await api.get(`/clients/${userId}/orders`);
  return response;
};

// Get client earnings (Protected)
export const getClientEarnings = async (userId, params = {}) => {
  const response = await api.get(`/clients/${userId}/earnings`, { params });
  return response;
};

export default api;