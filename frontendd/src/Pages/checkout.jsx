import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import NexusLogo from '../assets/NexusLogo.png';
import { FaEdit, FaTrash, FaCcVisa, FaCcMastercard, FaCcPaypal, FaCcDiscover, FaMobileAlt } from 'react-icons/fa'; // Added FaMobileAlt for mobile money

// Initialize Stripe outside the component
const stripePromise = loadStripe('pk_test_51OvoL6KzYkQzGZz6rK8Z5Qe5f6Y5X8vJ9nX8vJ9nX8vJ9nX8vJ9nX8vJ9nX8vJ9nX8vJ9nX8vJ9nX8vJ9nX8vJ9'); // Replace with your Stripe publishable key

const Checkout = () => {
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card'); // Track payment method
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cart items on mount
  useEffect(() => {
    const fetchCart = async () => {
      if (!userId) {
        setError('User not authenticated');
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`/api/cart/${userId}`);
        setCartItems(response.data.items || []);
      } catch (err) {
        setError('Failed to load cart items');
        console.error('Error fetching cart:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [userId, navigate]);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.finalCharge || 0), 0);
  const shipping = 10;
  const total = (subtotal + shipping).toFixed(2);

  // Handle delete item
  const handleDelete = async (productId) => {
    try {
      await axios.delete(`/api/cart/${userId}/${productId}`);
      setCartItems(cartItems.filter(item => item.productId !== productId));
    } catch (err) {
      setError('Failed to delete item');
      console.error('Delete error:', err);
    }
  };

  // Handle edit item
  const handleEdit = (item) => {
    navigate('/client-dashboard', { state: { itemToEdit: item } });
  };

  // Handle pay with conditional logic for payment methods
  const handlePay = async () => {
    try {
      setLoading(true);
      setError(null);

      if (selectedPaymentMethod === 'mpesa' || selectedPaymentMethod === 'airtel') {
        // Custom mobile money payment flow (e.g., M-Pesa or Airtel Money)
        const response = await axios.post(`/api/mobile-payment`, {
          userId,
          cartItems,
          total,
          paymentMethod: selectedPaymentMethod,
        });
        console.log(`${selectedPaymentMethod} payment initiated:`, response.data);
        navigate('/checkout-success'); // Assuming success for now
      } else {
        // Stripe payment flow for cards and supported methods
        const response = await axios.post('/api/create-checkout-session', {
          userId,
          cartItems,
          total,
          voucherCode,
        });

        const sessionId = response.data.id;
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          setError(error.message);
        }
      }
    } catch (err) {
      setError('Failed to initiate payment');
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen bg-indigo-100">
      {/* Header with Logo */}
      <header className="bg-white shadow-md p-4 flex items-center">
        <img src={NexusLogo} alt="Nexus Logo" className="w-12 h-12" />
      </header>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row max-w-6xl mx-auto p-8 gap-8">
        {/* Left Side: Cart Items */}
        <div className="md:w-2/3">
          <h2 className="text-2xl font-bold text-blue-600 mb-4">Your Cart</h2>
          {cartItems.length === 0 ? (
            <p className="text-gray-600">Your cart is empty.</p>
          ) : (
            <ul className="space-y-4">
              {cartItems.map((item) => (
                <li key={item.productId} className="flex justify-between items-center bg-white p-4 rounded-md shadow-sm">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{item.productName}</h3>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="text-lg font-semibold text-blue-600">${item.finalCharge.toFixed(2)}</p>
                    <button onClick={() => handleEdit(item)} className="text-blue-500 hover:text-blue-700" aria-label="Edit item">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(item.productId)} className="text-red-500 hover:text-red-700" aria-label="Delete item">
                      <FaTrash />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right Side: Payment Methods, Voucher, Summary */}
        <div className="md:w-1/3 bg-white p-6 rounded-md shadow-md">
          <h2 className="text-xl font-bold text-blue-600 mb-4">Payment Details</h2>

          {/* Payment Methods */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Accepted Payment Methods</h3>
            <div className="flex flex-wrap gap-4 text-gray-600">
              <FaCcVisa className="text-3xl" title="Visa" />
              <FaCcMastercard className="text-3xl" title="Mastercard" />
              <FaCcPaypal className="text-3xl" title="PayPal" />
              <FaCcDiscover className="text-3xl" title="Discover" />
              <FaMobileAlt className="text-3xl" title="M-Pesa" />
              <FaMobileAlt className="text-3xl" title="Airtel Money" />
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Payment Method</label>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="card">Card (Stripe)</option>
              <option value="mpesa">Pay via M-Pesa</option>
              <option value="airtel">Pay via Airtel Money</option>
            </select>
          </div>

          {/* Voucher */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Voucher Code</label>
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
              placeholder="Enter voucher code"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              className="mt-2 bg-blue-500 text-white px-4 py-1 rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => console.log('Apply voucher:', voucherCode)}
            >
              Apply
            </button>
          </div>

          {/* Price Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Price Summary</h3>
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 mt-2">
              <span>Shipping:</span>
              <span>${shipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-blue-600 mt-2">
              <span>Total:</span>
              <span>${total}</span>
            </div>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePay}
            className="w-full bg-green-500 text-white px-4 py-2 rounded-md text-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Pay'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;