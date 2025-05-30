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
  return response.data.data.categories;
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
export const fetchCart = async () => {
  const response = await api.get(`/api/cart/`);
  console.log('fetchCart response:', response.data);
  return response.data.data.cart || [];
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

export const fetchOneOrder = async (orderNumber) => {
  console.log('fetchOneOrder called with orderNumber:', orderNumber);
  const response = await api.get(`/api/orders/${orderNumber}`);
  console.log('fetchOneOrder response:', response.data);
  return response.data.data.order; // e.g., [{ id, itemName, photo, quantity, unitPrice, totalPrice, details, ... }]
};

// PRODUCT ENDPOINTS FOR TRAVELERS
// Retrieve all products (Public or Protected)
// export const getAvailableProducts = async (filters = {}) => {
//   try {
//     const response = await api.post('/api/products/search/', { ...filters, page: 1 });
//     console.log('getAvailableProducts response:', response.data.data.products);
//     return response.data.data.products; // Returns { message, products, pagination, filters }
//   } catch (error) {
//     console.error('Error fetching available products:', error);
//     throw error;
//   }
// };

export const getAvailableProducts = async (filters = {}) => {
  try {
    const response = await api.get('/api/products/orders', { params: filters });
    return response.data.data.products;
  } catch (error) {
    console.error('getAvailableProducts error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

// Retrieve a specific product (Public or Protected)
export const getProductDetails = async (productId) => {
  try {
    const response = await api.post('/api/products/search/', { id: productId });
     if (response.data?.data?.products?.length > 0) {
      const product = response.data.data.products[0];
      return product; // Return the first (and only) product
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
  return response.data.data.order;
};

// PAYMENT ENDPOINTS
//One Function to handle all payments
export const createCheckoutSessionCombined = async ({
    userId,
    paymentMethod,
    phoneNumber,
    amount,
    paymentMethodId,
    email,
    cartItems,
    voucherCode,
  }) => {
    try {
      console.log('createCheckoutSessionCombined called with:', {
        userId,
        paymentMethod,
        phoneNumber,
        amount,
        paymentMethodId,
        email,
        cartItems,
        voucherCode,
      })
      if (!userId || !paymentMethod || !amount || !cartItems || !Array.isArray(cartItems)) {
        throw new Error('Missing or invalid required parameters');
      }

      if (typeof amount !== 'number' || amount <= 0) {
        throw new Error('Amount must be a number and greater than 0');
      }

      const payload = {
        userId,
        paymentMethod,
        amount,
        cartItems,
        voucherCode,
        phoneNumber: paymentMethod === 'Mpesa' || paymentMethod === 'Airtel' ? phoneNumber : undefined,
        paymentMethodId: paymentMethod === 'Stripe' ? paymentMethodId : undefined,
        email: paymentMethod === 'Paystack' ? email : undefined,
      };

      const response = await api.post('/api/payments/combined', payload);
      return response.data;
    } catch (error) {
      console.error('Payment Initiation Error:', {
        userId,
        paymentMethod,
        error: error.response?.data || error.message,
      });

      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to initiate payment';

      throw new Error(errorMessage);
    }
  };

// Initiate M-Pesa payment (Protected)
export const initiateMpesaMobilePayment = async (userId, orderNumber, phoneNumber, amount) => {
  try{
    if (!userId || !orderNumber || !phoneNumber || !amount) {
      throw new Error('Missing required parameters');
    }

    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Amount must be a number and greater than 0');
    }

    const response = await api.post('/api/payments/mpesa', { userId, orderNumber, phoneNumber, amount });

    if (!response.data.success) {
      throw new Error(response.data.data?.message || 'Payment initiation failed');
    }

    return response.data;
  } catch (error) {
     console.error('Payment Initiation Error:', {
      userId,
      orderNumber,
      error: error.response?.data || error.message
    });

    const errorMessage = error.response?.data?.error 
      || error.response?.data?.message
      || error.message
      || 'Failed to initiate payment';

    throw new Error(errorMessage);
  }
};

// Initiate Airtel payment (Protected)
export const initiateAirtelMobilePayment = async (userId, orderNumber, phoneNumber, amount) => {
  try {
    if (!userId || !orderNumber || !phoneNumber || !amount) {
      throw new Error('Missing required parameters');
    }

    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Amount must be a number and greater than 0');
    }
  
    const response = await api.post('/api/payments/airtel', { userId, orderNumber, phoneNumber, amount });
    return response.data;
  } catch (error) {
    console.error('Payment Initiation Error:', {
      userId,
      orderNumber,
      error: error.response?.data || error.message
    });
  
    const errorMessage = error.response?.data?.error 
      || error.response?.data?.message
      || error.message
      || 'Failed to initiate payment';
  
    throw new Error(errorMessage);
  }
};

// initiate paystack Payment
export const initiatePaystackPayment = async (userId, orderNumber, email, amount) => {
   try {
    if (!userId || !orderNumber || !email || !amount) {
      throw new Error('Missing required parameters');
    }

    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Amount must be a number and greater than 0');
    }
  
    const response = await api.post('/api/payments/paystack/initialize', { userId, orderNumber, email, amount });
    return response.data;
  } catch (error) {
    console.error('Payment Initiation Error:', {
      userId,
      orderNumber,
      error: error.response?.data || error.message
    });
  
    const errorMessage = error.response?.data?.error 
      || error.response?.data?.message
      || error.message
      || 'Failed to initiate payment';
  
    throw new Error(errorMessage);
  }
}

// Verify Paystack Payment
export const verifyPaystackPayment = async (reference) => {
  try {
    const response = await api.get(`/api/payments/paystackverify/${reference}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to verify payment');
  }
};

//mpesa callback
export const mpesaCallback = async (data) => {
  try {
    const response = await api.post('/api/payments/mpesacallback', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to verify payment');
  }
}
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
export const getTravelerEarnings = async () => {
  try {
    const response = await api.get(`/api/travelers/earnings`);
    console.l
    return response.data;
  } catch (error) {
    console.error('getTravelerEarnings error:', error.response?.data || error.message);
    throw error;
  }
};

// Get traveler history (Protected)
export const getTravelerHistory = async (userId) => {
  try {
    const response = await api.get(`/api/travelers/${userId}/history`);
    return {
      success: true,
      data: response.data,
    };
  } catch (err) {
    console.error('Get traveler history error:', err);
    throw new Error(err.response?.data?.message || 'Failed to fetch traveler history');
  }
};

// Assign fulfillment to traveler (Protected)
// api.js
export const assignFulfillment = async (productId) => {
  try {
    const response = await api.put(`/api/orders/${productId}/claim`, { productId });
    console.log('assignFulfillment response:', response.data);
    return response.data;
  } catch (error) {
    console.error('assignFulfillment error:', error.response?.data || error.message);
    throw new Error(`Request failed with status ${error.response?.status || 'unknown'}`);
  }
};

// Update delivery status (protected)
export const updateDeliveryStatus = async (productId, deliveryStatus) => {
  try {
    console.log('updateDeliveryStatus called with productId:', productId, 'and status:');
    const response = await api.put(`/api/orders/deliveryStatus`, {
      productId,
      deliveryStatus,
    });
    return response.data;
  } catch (err) {
    console.error('Update delivery status error:', err);
    throw new Error(err.response?.data?.message || 'Failed to update delivery status');
  }
};

export const updateProductDeliveryStatus = async (productId, deliveryStatus) => {
  try {
    console.log('updateDeliveryStatus called with productId:', productId, 'and status:');
    const response = await api.put(`/api/orders/clientDeliveryStatus`, {
      productId,
      deliveryStatus,
    });
    return response.data;
  } catch (err) {
    console.error('Update delivery status error:', err);
    throw new Error(err.response?.data?.message || 'Failed to update delivery status');
  }
};

// Update delivery proof (protected)
export const uploadDeliveryProof = async (orderId, file) => {
  try {
    if (!orderId || !file) {
      throw new Error('Missing order ID or file');
    }
    const base64String = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data URL prefix
      reader.onerror = error => reject(error);
    });

    const response = await api.post('/api/travelers/orders/${orderId}/delivery-proof', {
      deliveryProof: base64String,
      mimeType: file.type
    });


    return {
      success: true,
      orderId,
      proofUrl: response.data.proofUrl
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to upload proof',
      error: error.message
    };
  }
};

// RATING ENDPOINTS
// Rate client (Protected)
export const rateClient = async (ratingData) => {
  try {
    const response = await api.post('/api/ratings/traveler-to-client', ratingData);
    return response.data.data;
  } catch (error) {
    console.error('Submit traveler to client rating error:', error.response?.data || error.message);
    throw error;
  }
};

// Rate traveler (Protected)
export const rateTraveler = async (ratingData) => {
  try {
    const response = await api.post('/api/ratings/client-to-traveler', ratingData);
    return response.data.data;
  } catch (error) {
    console.error('Submit client to traveler rating error:', error.response?.data || error.message);
    throw error;
  }
};

// Get traveler ratings (Protected)
export const getTravelerRatings = async (userId) => {
  try {
    const response = await api.get(`/api/ratings/traveler/${userId}`);
    return response.data.data.rating;
  } catch (error) {
    console.error('Get traveler ratings error:', error.response?.data || error.message);
    throw error;
  }
};

// Get clients ratings  (Protected)
export const getClientRatings = async (userId) => {
  try {
    const response = await api.get(`/api/ratings/client/${userId}`);
    return response.data.data.rating;
  } catch (error) {
    console.error('Get client ratings error:', error.response?.data || error.message);
    throw error;
  }
};

// Get order ratings (Protected)
export const getOrderRatings = async (orderNumber) => {
  try {
    const response = await api.get(`/api/ratings/orders/${orderNumber}`);
    return response.data.data;
  } catch (error) {
    console.error('Get order ratings error:', error.response?.data || error.message);
    throw error;
  }
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