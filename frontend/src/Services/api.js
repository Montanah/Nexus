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

// Category API call
export const getCategories = async () => {
  const response = await api.get('/api/categories');
  return response;
};

// Add to cart
export const addToCart = async (formData) => {
  const response = await api.post('/api/cart', formData);
  return response.data;
};

// Product photo upload
export const uploadProductPhotos = async (formData) => {
  const response = await api.post('/api/products/photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Update product in cart
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

// fetch orders/products for a specific client
export const fetchOrders = async (userId) => {
  const response = await api.get(`/api/products/${userId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
  });
  return response.data; // e.g., [{ id, itemName, photo, quantity, unitPrice, totalPrice, details, ... }]
};

// Product-related endpoints for travelers
// Retrieve all products
export const getAvailableProducts = async (filters) => {
  const response = await api.get('/api/products/', { params: filters }); 
  return response;
};

// Retrieve a specific product
export const getProductDetails = async (productId) => {
  const response = await api.get(`/api/products/${productId}`);
  return response;
};

// Save product listing
export const saveProduct = async (formData) => {
  const response = await api.post('/api/products', formData);
  return response.data;
};

// Update a product/order
export const updateProductDetails = async (productId, formData) => {
  const response = await api.put(`/api/products/${productId}`, formData);
  return response.data;
}

// Delete a product/order
export const deleteProduct = async (productId) => {
  const response = await api.delete(`/api/products/${productId}`);
  return response.data;
}

// Checkout
export const checkout = async (formData) => {
  const response = await api.post('/checkout', formData);
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

export const getTravelerEarnings = async (userId, params = {}) => {
  const response = await api.get(`/api/travelers/${userId}/earnings`, { params });
  return response;
};

export const getTravelerHistory = async (userId) => {
  const response = await api.get(`/api/travelers/${userId}/history`);
  return response;
};

// Assign fullfilment to traveler
export const assignFulfillment = async (productId, userId) => {
  const response = await api.post('/api/products/assign', { productId, userId });
  return response.data;
};

// Update delivery status
export const updateDeliveryStatus = async (deliveryId, status) => {
  const response = await api.put(`/api/update/${deliveryId}`, { status });
  return response.data;
}

// Upload proof of delivery
export const uploadDeliveryProof = async (formData) => {
  const response = await api.post('/api/proof', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
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

export const getTravelerRatings = async (userId) => {
  const response = await api.get(`/api/ratings/traveler/${userId}`);
  return response;
};

export const getClientRatings = async (userId) => {
  const response = await api.get(`/api/ratings/client/${userId}`);
  return response;
};

// Client Dashboard API calls
export const getClientOrders = async (userId) => {
  const response = await api.get(`/api/clients/${userId}/orders`);
  return response;
};

export const getClientEarnings = async (userId, params = {}) => {
  const response = await api.get(`/api/clients/${userId}/earnings`, { params });
  return response;
};
export default api;