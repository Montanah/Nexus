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

// Request password reset
export const requestPasswordReset = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
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

// Checkout
export const checkout = async (formData) => {
  const response = await api.post('/api/checkout', formData);
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

// Initiate Mpesa mobile payment (M-Pesa or Airtel Money)
export const initiateMpesaMobilePayment = async (userId, cartItems, total, paymentMethod) => {
  const response = await api.post('/api/daraja-api endpoint', {  // Replace 'daraja-api endpoint' with the actual endpoint
    userId,
    cartItems,
    total,
    paymentMethod,
  }, {
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
  });
  return response.data;
};

// Initiate Airtel mobile payment (M-Pesa or Airtel Money)
export const initiateAirtelMobilePayment = async (userId, cartItems, total, paymentMethod) => {
  const response = await api.post('/api/mobile-payment', {
    userId,
    cartItems,
    total,
    paymentMethod,
  }, {
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
  });
  return response.data;
};

// Create Stripe checkout session
export const createCheckoutSession = async (userId, cartItems, total, voucherCode) => {
  const response = await api.post('/api/create-checkout-session', {
    userId,
    cartItems,
    total,
    voucherCode,
  }, {
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
  });
  return response.data;
};

export default api;