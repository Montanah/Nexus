// components/PaymentManagementComponent.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { PermissionGuard } from '../AuthContext';
import { fetchPayments, processPayment, releaseFunds } from '../api';
import { DollarSign, CheckCircle, Plus } from 'lucide-react';

const PaymentManagementComponent = ({ isDarkTheme }) => {
  const { admin } = useAuth();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    orderId: '',
    productId: '',
    amount: '',
    paymentMethod: 'credit_card',
  });

  useEffect(() => {
    const fetchPaymentsData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const paymentsData = await fetchPayments();
        setPayments(paymentsData);
      } catch (err) {
        setError('Failed to fetch payments. Please try again.');
        console.error('Fetch payments error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentsData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const paymentData = {
        clientId: formData.clientId,
        orderId: formData.orderId,
        productId: formData.productId,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
      };
      const response = await processPayment(paymentData);
      setPayments((prev) => [...prev, response.payment]);
      setIsFormOpen(false);
      setFormData({ clientId: '', orderId: '', productId: '', amount: '', paymentMethod: 'credit_card' });
    } catch (err) {
      setError('Failed to process payment.');
      console.error('Process payment error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReleaseFunds = async (paymentId, travelerId) => {
    if (!window.confirm('Are you sure you want to release funds for this payment?')) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await releaseFunds(paymentId, travelerId);
      setPayments((prev) =>
        prev.map((payment) =>
          payment._id === paymentId ? { ...payment, status: 'released', traveler: travelerId } : payment
        )
      );
    } catch (err) {
      setError('Failed to release funds.');
      console.error('Release funds error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PermissionGuard permission="edit_orders" fallback={<div className="p-6 text-center">Access denied. You need payment management permissions.</div>}>
      <div className={`p-6 ${isDarkTheme ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Payment Management</h2>
          <button
            onClick={() => setIsFormOpen(true)}
            className={`flex items-center px-4 py-2 rounded ${isDarkTheme ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          >
            <Plus className="w-5 h-5 mr-2" /> Process Payment
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={`w-full ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <thead>
                  <tr className={isDarkTheme ? 'bg-gray-600' : 'bg-gray-100'}>
                    <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Order ID</th>
                    <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Client</th>
                    <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Product</th>
                    <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Product Fee</th>
                    <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Product Markup</th>
                    <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Commission</th>
                    <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Total Amount</th>
                    <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Status</th>
                    <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Traveler</th>
                    {/* <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Amount to Pay</th> */}
                    <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={isDarkTheme ? 'divide-gray-600' : 'divide-gray-200'}>
                  {payments.map((payment) => (
                    <tr key={payment._id} className={isDarkTheme ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}>
                      <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>{payment.order.orderNumber}</td>
                      <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>{payment.client?.name || 'N/A'}</td>
                      <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>{payment.product?.productName}</td>
                      <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>KES {payment.product?.productFee.toFixed(2)}</td>
                      <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>KES {payment.product?.productMarkup.toFixed(2)}</td>
                      <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>KES {payment.product?.rewardAmount.toFixed(2)}</td>
                      <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>KES {payment.totalAmount.toFixed(2)}</td>
                      <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>
                        <span className={`px-2 py-1 rounded ${payment.status === 'escrow' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>{payment.product?.claimedBy || 'N/A'}</td>
                      
                      <td className="p-3">
                        {payment.status === 'escrow' && (
                          <input
                            type="text"
                            placeholder="Traveler ID"
                            onChange={(e) => {
                              const travelerId = e.target.value;
                              if (e.key === 'Enter' && travelerId) {
                                handleReleaseFunds(payment._id, travelerId);
                              }
                            }}
                            className={`p-1 border rounded ${isDarkTheme ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-100 border-gray-300'}`}
                          />
                        )}
                        {payment.status === 'released' && (
                          <span className="text-green-500">Funds Released</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isFormOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className={`p-6 rounded-lg ${isDarkTheme ? 'bg-gray-700' : 'bg-white'}`}>
                  <h3 className="text-xl font-bold mb-4">Process New Payment</h3>
                  <form onSubmit={handleProcessPayment} className="space-y-4">
                    <input
                      type="text"
                      name="clientId"
                      value={formData.clientId}
                      onChange={handleInputChange}
                      placeholder="Client ID"
                      className={`w-full p-2 border rounded ${isDarkTheme ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-100 border-gray-300'}`}
                      required
                    />
                    <input
                      type="text"
                      name="orderId"
                      value={formData.orderId}
                      onChange={handleInputChange}
                      placeholder="Order ID"
                      className={`w-full p-2 border rounded ${isDarkTheme ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-100 border-gray-300'}`}
                      required
                    />
                    <input
                      type="text"
                      name="productId"
                      value={formData.productId}
                      onChange={handleInputChange}
                      placeholder="Product ID"
                      className={`w-full p-2 border rounded ${isDarkTheme ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-100 border-gray-300'}`}
                      required
                    />
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="Amount"
                      className={`w-full p-2 border rounded ${isDarkTheme ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-100 border-gray-300'}`}
                      required
                      step="0.01"
                    />
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                      className={`w-full p-2 border rounded ${isDarkTheme ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-100 border-gray-300'}`}
                    >
                      <option value="credit_card">Credit Card</option>
                      <option value="paypal">PayPal</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setIsFormOpen(false)}
                        className={`px-4 py-2 rounded ${isDarkTheme ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300 hover:bg-gray-400'}`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`px-4 py-2 rounded ${isDarkTheme ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Processing...' : 'Process Payment'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PermissionGuard>
  );
};

export default PaymentManagementComponent;