import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_KEY || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.response?.data?.data?.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// Signup 
export const signup = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Login
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/loginUser', credentials);
  return response.data;
};

// Verify OTP
export const verifyLoginOTP = async (otpData) => {
  const response = await api.post('/auth/verifyLoginOTP', otpData);
  return response.data;
};

// Forgot password
export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgotPassword', { email });
  return response.data;
};

// Reset password
export const resetPassword = async (token , newPassword) => {
  const response = await api.post('/auth/resetPassword', {token, password: newPassword});
  return response.data;
};

// Fetch user data based on userId
export const fetchUser = async (userId, token) => {
  const response = await api.get(`/auth/user/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Logout
export const logoutUser = async (token) => {
  const response = await api.post('/auth/logout', {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// fetch orders
export const fetchOrders = async (userId) => {
  const response = await api.get(`/api/orders/${userId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
  });
  return response.data; // e.g., [{ id, itemName, photo, quantity, unitPrice, totalPrice, details, ... }]
};

// Checkout
export const checkout = async (formData) => {
  const response = await api.post('/checkout', formData);
  return response.data;
};

// Add to cart
export const addToCart = async (formData) => {
  const response = await api.post('/api/cart', formData);
  return response.data;
};

// Save product listing
export const saveProduct = async (formData) => {
  const response = await api.post('/api/products', formData);
  return response.data;
};

// Update product listing
export const updateProduct = async (userId, productId, formData) => {
  const response = await api.put(`/api/cart/${userId}/${productId}`, formData);
  return response.data;
};

// Fetch cart items for a user
export const fetchCart = async (userId) => {
  const response = await api.get(`/api/cart/${userId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
  });
  return response.data.items || [];
};

// Delete cart item
export const deleteCartItem = async (userId, productId) => {
  const response = await api.delete(`/api/cart/${userId}/${productId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
  });
  return response.data;
};

// Initiate M-Pesa payment
export const initiateMpesaMobilePayment = async (userId, cartItems, total) => {
  const response = await api.post('/api/mpesa-payment', {
    userId,
    cartItems,
    total,
  }, {
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
  });
  return response.data; // e.g., { orderNumber: "MPESA123", status: "success" }
};

// Initiate Airtel payment
export const initiateAirtelMobilePayment = async (userId, cartItems, total) => {
  const response = await api.post('/api/airtel-payment', {
    userId,
    cartItems,
    total,
  }, {
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
  });
  return response.data; // e.g., { orderNumber: "AIRTEL456", status: "success" }
};

// Fetch payment details for use with stripe success redirect
export const fetchPaymentDetails = async (sessionId) => {
  const response = await api.get(`/api/payment-details/${sessionId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
  });
  return response.data; // { cartItems, total, paymentMethod, orderNumber, clientName }
};

// Create Stripe checkout session
export const createCheckoutSession = async (userId, cartItems, total, voucherCode) => {
  const response = await api.post('/api/create-checkout-session', {
    userId,
    cartItems,
    total,
    voucherCode,
    successUrl: `${window.location.origin}/payment-success`, // Added for Stripe
    cancelUrl: `${window.location.origin}/checkout`, // Added for Stripe
  }, {
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
  });
  return response.data; // e.g., { id: "stripe-session-id" }
};

// Traveler Dashboard API calls
export const getTravelerOrders = async (filters) => {
  const response = await api.get('/api/travelers/orders', { params: filters });
  return response;
};

export const getTravelerEarnings = async (travelerId, params = {}) => {
  const response = await api.get(`/api/travelers/${travelerId}/earnings`, { params });
  return response;
};

export const getTravelerHistory = async (travelerId) => {
  const response = await api.get(`/api/travelers/${travelerId}/history`);
  return response;
};

// Traveler & Client rating API calls
export const rateClient = async (data) => {
  const response = await api.post('/api/ratings/traveler-to-client', data);
  return response;
};

export const rateTraveler = async (data) => {
  const response = await api.post('/api/ratings/client-to-traveler', data);
  return response;
};

export const getTravelerRatings = async (travelerId) => {
  const response = await api.get(`/api/ratings/traveler/${travelerId}`);
  return response;
};

export const getClientRatings = async (clientId) => {
  const response = await api.get(`/api/ratings/client/${clientId}`);
  return response;
};

// Client Dashboard API calls
export const getClientOrders = async (clientId) => {
  const response = await api.get(`/api/clients/${clientId}/orders`);
  return response;
};

export const getClientEarnings = async (clientId, params = {}) => {
  const response = await api.get(`/api/clients/${clientId}/earnings`, { params });
  return response;
};
export default api;