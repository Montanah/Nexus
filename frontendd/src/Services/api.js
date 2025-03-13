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

export default api;