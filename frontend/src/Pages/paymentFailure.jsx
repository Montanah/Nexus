import { useLocation } from 'react-router-dom';

const PaymentFailure = () => {
  const location = useLocation();
  const {
    paymentMethod = 'Credit Card',
    paymentDetails = '**** **** **** 1234',
    totalAmount = '0.00',
    reason = 'Transaction declined by issuer',
  } = location.state || {};

  // Map payment methods to logos (aligned with Checkout options)
  const paymentLogos = {
    'Credit Card': {
      logo: 'https://via.placeholder.com/24x24?text=Card', // Replace with actual card logo
      type: 'card',
    },
    'PayPal': {
      logo: 'https://via.placeholder.com/24x24?text=PayPal', // Replace with PayPal logo
      type: 'email',
    },
    'M-Pesa': {
      logo: 'https://via.placeholder.com/24x24?text=M-Pesa', // Replace with M-Pesa logo
      type: 'phone',
    },
    'Airtel Money': {
      logo: 'https://via.placeholder.com/24x24?text=Airtel', // Replace with Airtel logo
      type: 'phone',
    },
  };

  const { logo, type } = paymentLogos[paymentMethod] || paymentLogos['Credit Card'];

  const formatPaymentDetails = (details, type) => {
    if (type === 'card' && details.length >= 4) {
      return `**** **** **** ${details.slice(-4)}`;
    }
    return details;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-red-600 mb-4 text-center">Payment Failed</h1>
        <p className="text-gray-600 text-sm sm:text-base text-center mb-6">
          {reason}. Please try again with a different payment method or contact support if the issue persists.
        </p>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm sm:text-base font-medium text-gray-700 flex-shrink-0">Mode of Payment:</span>
            <div className="flex items-center space-x-2 whitespace-nowrap overflow-x-hidden">
              <img
                src={logo}
                alt={`${paymentMethod} Logo`}
                className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
              />
              <span className="text-sm sm:text-base font-bold text-gray-950 truncate">
                {paymentMethod} ({formatPaymentDetails(paymentDetails, type)})
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm sm:text-base font-medium text-gray-700">Total Amount:</span>
            <span className="text-sm sm:text-base font-bold text-gray-950">KES{parseFloat(totalAmount).toFixed(2)}</span>
          </div>
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm sm:text-base"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;