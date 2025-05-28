import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyPaystackPayment } from '../Services/api';
import { FaSpinner } from 'react-icons/fa';

const PaystackVerify = () => {
  const location = useLocation();  
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const reference = params.get('reference');
  const [verificationStatus, setVerificationStatus] = useState('verifying'); 

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference) {
        setVerificationStatus('error');
        navigate('/payment-failure', {
          state: {
            paymentMethod: 'Paystack',
            reason: 'Missing reference parameter',
          },
        });
        return;
      }

      try {
        const paymentData = await verifyPaystackPayment(reference);
        console.log('Paystack verification response:', paymentData);
        console.log('Paystack verification status:', paymentData.success);

        if (paymentData.success === true) {
          setVerificationStatus('success');
          navigate('/payment-success', {
            state: {
              paymentMethod: 'Paystack',
              paymentDetails: paymentData.email || 'Unknown Email',
              totalAmount: paymentData.amount / 100, 
              orderNumber: paymentData.orderNumber || `ORD-${Date.now()}`,
            },
          });
        } else {
          throw new Error(paymentData.message || 'Payment not successful');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setVerificationStatus('error');
        navigate('/payment-failure', {
          state: {
            paymentMethod: 'Paystack',
            reason: error.message || 'Payment verification failed. Please try again or contact support.',
            retry: true, 
          },
        });
      }
    };

    verifyPayment();
  }, [reference, navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold mb-4">
          {verificationStatus === 'verifying' ? 'Verifying Payment...' : 'Payment Verification'}
        </h2>
        {verificationStatus === 'verifying' ? (
          <div className="flex items-center justify-center">
            <FaSpinner className="animate-spin text-3xl text-indigo-600 mr-2" />
            <p>Please wait while we verify your Paystack payment.</p>
          </div>
        ) : (
          <p>
            {verificationStatus === 'success'
              ? 'Payment verified! Redirecting to confirmation...'
              : 'Verification failed. Redirecting to error page...'}
          </p>
        )}
      </div>
    </div>
  );
};

export default PaystackVerify;