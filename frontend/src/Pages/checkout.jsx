import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../Context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { FaEdit, FaTrash, FaCcVisa, FaCcMastercard, FaCcPaypal, FaCcDiscover, FaMobileAlt } from 'react-icons/fa';
import { fetchCart, createCheckoutSessionCombined, checkout, fetchOneOrder, deleteCartItem, initiateMpesaMobilePayment, initiateAirtelMobilePayment, createCheckoutSession } from '../Services/api';
import Header from '../Components/Header';

// Initialize Stripe outside the component
const stripePromise = loadStripe('pk_test_51OvoL6KzYkQzGZz6rK8Z5Qe5f6Y5X8vJ9nX8vJ9nX8vJ9nX8vJ9nX8vJ9nX8vJ9nX8vJ9nX8vJ9nX8vJ9nX8vJ9'); // Replace with your Stripe publishable key

const Checkout = () => {
  const { userId, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartItems, setCartItems] = useState([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({}); // For card number, phone number, etc.
  
  useEffect(() => {
      if (!authLoading && !userId) {
        navigate('/login');
      } 
      console.log('Auth loading:', authLoading, 'User ID:', userId);
      console.log('User:', user);
    }, [authLoading, userId, navigate]);

  // Fetch cart items on mount
  useEffect(() => {
    const fetchCartData = async () => {
      if (!userId) return;
       try {
        setLoading(true);
        let items = [];
        if (location.state?.retry && location.state?.cartItems) {
          items = location.state.cartItems; // Restore cart from failure state
        } else {
          items = await fetchCart(userId);
        }
        console.log('Cart items:', items);
        setCartItems(items);
        // const items = await fetchCart(userId);
        // console.log('Cart items:', items);
        // setCartItems(items);

        if (items.length === 0 && !location.state?.retry) {
          navigate('/new-order');
        }
      } catch (err) {
        setError('Failed to load cart items');
        console.error('Error fetching cart:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCartData();
  }, [userId, navigate, location.state]);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.finalCharge || 0), 0);
  const total = Number(subtotal.toFixed(2));
  const displayTotal = subtotal.toFixed(2);

  // Handle delete item
  const handleDelete = async (productId) => {
    try {
      await deleteCartItem(userId, productId);
      setCartItems(cartItems.filter(item => item.productId !== productId));
    } catch (err) {
      setError('Failed to delete item');
      console.error('Delete error:', err);
    }
  };

  // Handle edit item
  const handleEdit = (item) => {
    navigate('/new-order', { state: { itemToEdit: item } });
  };

  // Handle input change for payment fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails(prev => ({ ...prev, [name]: value }));
  };

  // Apply voucher (placeholder)
  const applyVoucher = () => {
    console.log('Voucher applied:', voucherCode);
    // TODO: Implement voucher logic
  };

  // Handle pay with failure navigation
  const handlePay = async () => {
    const paymentDetailsForFailure = {
        paymentMethod: 
          selectedPaymentMethod === 'mpesa' ? 'M-Pesa' :
          selectedPaymentMethod === 'airtel' ? 'Airtel Money' :
          selectedPaymentMethod === 'card' ? 'Credit Card' :
          selectedPaymentMethod === 'paypal' ? 'PayPal' :
          'Paystack',
        paymentDetails:
          selectedPaymentMethod === 'card' ? paymentDetails.cardNumber || 'Unknown Card' :
          selectedPaymentMethod === 'paypal' ? paymentDetails.paypalEmail || 'Unknown Email' :
          selectedPaymentMethod === 'paystack' ? paymentDetails.paystackEmail || 'Unknown Email' : 
          paymentDetails.phoneNumber || 'Unknown Phone',
        totalAmount: total,
        cartItems,
    };

    try {
      setLoading(true);
      setError(null);

      if (!selectedPaymentMethod) {
        setError('Please select a payment method');
        setLoading(false);
        return;
      }

      const payload = {
        userId,
        paymentMethod:
          selectedPaymentMethod === 'mpesa' ? 'Mpesa' :
          selectedPaymentMethod === 'airtel' ? 'Airtel' :
          selectedPaymentMethod === 'card' || selectedPaymentMethod === 'paypal' ? 'Stripe' :
          'Paystack',
        phoneNumber: selectedPaymentMethod === 'mpesa' || selectedPaymentMethod === 'airtel' ? paymentDetails.phoneNumber : undefined,
        amount: total,
        paymentMethodId: selectedPaymentMethod === 'card' || selectedPaymentMethod === 'paypal' ? paymentDetails.paymentMethodId : undefined,
        email: selectedPaymentMethod === 'paystack' ? user?.data?.user?.email : undefined,
        cartItems, // Pass cart items to create order on backend
        voucherCode: selectedPaymentMethod === 'card' || selectedPaymentMethod === 'paypal' ? voucherCode : undefined,
      };
      console.log('createCheckoutSessionCombined called with:', payload);

      const response = await createCheckoutSessionCombined(payload);
      console.log('Payment response:', response);

      if (selectedPaymentMethod === 'mpesa' || selectedPaymentMethod === 'airtel') {
        if (response.success) {
          paymentDetailsForFailure.orderNumber = response.orderNumber || `ORD-${Date.now()}`;
          navigate('/payment-success', { state: paymentDetailsForFailure });
        } else {
          navigate('/payment-failure', {
            state: { ...paymentDetailsForFailure, reason: response.message || 'Payment initiation failed' },
          });
        }
      } else if (selectedPaymentMethod === 'card' || selectedPaymentMethod === 'paypal') {
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({ sessionId: response.sessionId });
        if (error) {
          navigate('/payment-failure', {
            state: { ...paymentDetailsForFailure, reason: error.message || 'Payment declined by issuer' },
          });
        }
        // Success is handled by Stripe's success_url
      } else if (selectedPaymentMethod === 'paystack') {
        if (response.data.authorizationUrl) {
          paymentDetailsForFailure.orderNumber = response.orderNumber || `ORD-${Date.now()}`;
          window.location.href = response.data.authorizationUrl;
        } else {
          console.error('Paystack response missing authorizationUrl:', response);
          navigate('/payment-failure', {
            state: { ...paymentDetailsForFailure, reason: response.message || 'Paystack payment failed' },
          });
        }
      }
    } catch (err) {
      navigate('/payment-failure', {
        state: {
          ...paymentDetailsForFailure,
          reason: err.message || 'Failed to initiate payment',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-indigo-100 flex items-center justify-center">
        <p>Loading authentication...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-indigo-100 flex items-center justify-center">
        <p className="text-gray-600">Loading checkout...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-indigo-100 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-100">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-grow p-8 pt-24">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
          {/* Left Side: Cart Items */}
          <motion.div
            className="md:w-2/3"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-indigo-900 mb-6">Your Cart</h2>
            {cartItems.length === 0 ? (
              <p className="text-purple-700 text-center">Your cart is empty.</p>
            ) : (
              <ul className="space-y-4">
                {cartItems.map((item) => (
                  <motion.li
                    key={item.productId}
                    className="flex justify-between items-center bg-white p-4 rounded-xl shadow-md"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-indigo-900">{item.productName}</h3>
                      <p className="text-sm text-gray-700">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-700">Category: {item.category || 'N/A'}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <p className="text-lg font-semibold text-purple-700">${item.finalCharge.toFixed(2)}</p>
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-indigo-600 hover:text-indigo-800"
                        aria-label="Edit item"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(item.productId)}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Delete item"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.div>

          {/* Right Side: Payment Details */}
          <motion.div
            className="md:w-1/3 bg-white p-6 rounded-xl shadow-md"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-indigo-900 mb-4">Payment Details</h2>

            {/* Accepted Payment Methods */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Accepted Payment Methods</h3>
              <div className="flex flex-wrap gap-4">
                <FaCcVisa className="text-4xl text-blue-700" title="Visa" />
                <FaCcMastercard className="text-4xl text-red-600" title="Mastercard" />
                <FaCcPaypal className="text-4xl text-blue-500" title="PayPal" />
                <FaCcDiscover className="text-4xl text-orange-500" title="Discover" />
                <FaMobileAlt className="text-4xl text-green-600" title="M-Pesa/Airtel" />
              </div>
            </div>

            {/* Select Payment Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Payment Method</label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">Choose a payment method</option>
                <option value="card">Credit/Debit Card</option>
                <option value="paypal">PayPal</option>
                <option value="mpesa">Pay via M-Pesa</option>
                <option value="airtel">Pay via Airtel Money</option>
                <option value="paystack">Pay via Paystack</option>
              </select>
            </div>

            {/* Dynamic Payment Fields */}
            {selectedPaymentMethod === 'card' && (
              <div className="mb-6 space-y-2">
                <input
                  type="text"
                  name="cardNumber"
                  placeholder="Card Number"
                  className="w-full p-2 border rounded-md"
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  name="expiryDate"
                  placeholder="Expiry Date (MM/YY)"
                  className="w-full p-2 border rounded-md"
                  onChange={handleInputChange}
                />
                <input
                  type="text"
                  name="cvv"
                  placeholder="CVV"
                  className="w-full p-2 border rounded-md"
                  onChange={handleInputChange}
                />
              </div>
            )}

            {selectedPaymentMethod === 'paypal' && (
              <input
                type="email"
                name="paypalEmail"
                placeholder="PayPal Email"
                className="w-full p-2 border rounded-md mb-6"
                onChange={handleInputChange}
              />
            )}

            {['mpesa', 'airtel'].includes(selectedPaymentMethod) && (
              <input
                type="text"
                name="phoneNumber"
                placeholder="Phone Number"
                className="w-full p-2 border rounded-md mb-6"
                onChange={handleInputChange}
              />
            )}

            {/* Voucher Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Voucher Code</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Enter voucher code"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <button
                  onClick={applyVoucher}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Price Summary */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Price Summary</h3>
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>KES{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-purple-700 mt-2">
                <span>Total:</span>
                <span>KES{total}</span>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePay}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;