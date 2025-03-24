import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import { FaCalendarAlt, FaUser, FaCreditCard, FaHashtag, FaMoneyBillWave, FaLock, FaBox } from 'react-icons/fa';
import { useAuth } from '../Context/AuthContext';
import { fetchPaymentDetails } from '../Services/api';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [paymentData, setPaymentData] = useState(null);

  // Extract payment details from Checkout navigation state
  const {
    cartItems = [],
    total = '0.00',
    paymentMethod = 'Unknown',
    orderNumber = 'N/A',
    clientName = 'Guest', // Fallback if not provided
  } = location.state || {};

  const urlParams = new URLSearchParams(location.search);
  const sessionId = urlParams.get('session_id');

  // Optional: Fetch details for Stripe if state is missing
  useEffect(() => {
    if (sessionId && !location.state) {
      const loadPaymentDetails = async () => {
        try {
          const data = await fetchPaymentDetails(sessionId);
          setPaymentData(data);
        } catch (err) {
          console.error('Failed to fetch payment details:', err);
        }
      };
      loadPaymentDetails();
    }
  }, [sessionId]);

  // Format current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleContinueShopping = () => {
    navigate('/client-dashboard');
  };

  const handleLogout = () => {
    logout(); // Assuming this clears auth state
    navigate('/login');
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      {/* Header */}
      <Header />

      {/* Payment Success Content */}
      <div className="flex-grow flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-8">
          {/* Title */}
          <h2 className="text-3xl font-bold text-indigo-900 mb-2 text-center">
            Thank you for using Nexus!
          </h2>
          <p className="text-gray-600 text-sm text-center mb-8">
            You’ll receive confirmation via mail
          </p>

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center">
              <FaCalendarAlt className="text-indigo-600 mr-2" />
              <span className="text-gray-700 font-medium">Date</span>
            </div>
            <p className="text-gray-600">{currentDate}</p>

            <div className="flex items-center">
              <FaUser className="text-indigo-600 mr-2" />
              <span className="text-gray-700 font-medium">Client</span>
            </div>
            <p className="text-gray-600">{clientName}</p>

            <div className="flex items-center">
              <FaCreditCard className="text-indigo-600 mr-2" />
              <span className="text-gray-700 font-medium">Payment Method</span>
            </div>
            <p className="text-gray-600">{paymentMethod}</p>

            {/* Horizontal Line after first 3 items */}
            <hr className="col-span-2 border-gray-300 my-4" />

            <div className="flex items-center">
              <FaHashtag className="text-indigo-600 mr-2" />
              <span className="text-gray-700 font-medium">Order Number</span>
            </div>
            <p className="text-gray-600">{orderNumber}</p>

            <div className="flex items-center">
              <FaMoneyBillWave className="text-indigo-600 mr-2" />
              <span className="text-gray-700 font-medium">Total Amount Paid</span>
            </div>
            <p className="text-gray-600">${total}</p>
          </div>

          {/* Escrow Message */}
          <div className="flex items-center justify-center mb-6">
            <FaLock className="text-green-500 mr-2" />
            <p className="text-gray-600 text-sm">
              Amount successfully transferred to an escrow account
            </p>
          </div>

          {/* Horizontal Line after first 3 items */}
          <hr className="col-span-2 border-gray-300 my-4" />

          {/* Items Purchased */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-indigo-900 mb-4">Items Purchased</h3>
            {cartItems.length === 0 ? (
              <p className="text-gray-600 text-sm text-center">No items found.</p>
            ) : (
              <ul className="space-y-4">
                {cartItems.map((item) => (
                  <li
                    key={item.productId}
                    className="flex justify-between items-center border-b pb-2"
                  >
                    <div className="flex items-center">
                      <FaBox className="text-indigo-600 mr-2" />
                      <span className="text-gray-700">{item.productName}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                      <p className="text-indigo-600 font-semibold">${item.finalCharge.toFixed(2)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-between gap-4">
            <button
              onClick={handleContinueShopping}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-lg text-base"
            >
              Continue Shopping
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all shadow-lg text-base"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Footer - Centered at Bottom */}
      <div className="mt-auto w-full flex justify-center items-center text-gray-500 text-sm">
        <Footer />
      </div>
    </div>
  );
};

export default PaymentSuccess;