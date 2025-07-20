import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { PermissionGuard } from '../AuthContext';
import { fetchPayments, releaseFunds } from '../api';
import { DollarSign, CheckCircle, Clock, Shield, AlertCircle } from 'lucide-react';

const PaymentManagementComponent = ({ isDarkTheme }) => {
  const { admin } = useAuth();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [releaseLoading, setReleaseLoading] = useState({});
  const [selectedTravelers, setSelectedTravelers] = useState({});

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

  const handleTravelerChange = (paymentId, travelerId) => {
    setSelectedTravelers(prev => ({
      ...prev,
      [paymentId]: travelerId
    }));
  };

  const handleReleaseFunds = async (paymentId) => {
    const travelerId = selectedTravelers[paymentId];
    
    if (!travelerId) {
      setError('Please enter a traveler ID before releasing funds.');
      return;
    }

    if (!window.confirm('Are you sure you want to release funds for this payment? This action cannot be undone.')) {
      return;
    }

    setReleaseLoading(prev => ({ ...prev, [paymentId]: true }));
    setError('');
    
    try {
      const response = await releaseFunds(paymentId, travelerId);
      
      setPayments(prev =>
        prev.map(payment =>
          payment._id === paymentId 
            ? { ...payment, status: 'released', traveler: travelerId } 
            : payment
        )
      );

      // Clear the traveler input for this payment
      setSelectedTravelers(prev => {
        const updated = { ...prev };
        delete updated[paymentId];
        return updated;
      });

      // Show success message
      alert(`Funds released successfully! Traveler reward: KES ${response.travelerReward?.toFixed(2)}`);
      
    } catch (err) {
      setError('Failed to release funds. Please try again.');
      console.error('Release funds error:', err);
    } finally {
      setReleaseLoading(prev => ({ ...prev, [paymentId]: false }));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      escrow: {
        bg: 'bg-yellow-100 text-yellow-800',
        darkBg: 'bg-yellow-900 text-yellow-300',
        icon: Clock
      },
      released: {
        bg: 'bg-green-100 text-green-800',
        darkBg: 'bg-green-900 text-green-300',
        icon: CheckCircle
      },
      pending: {
        bg: 'bg-blue-100 text-blue-800',
        darkBg: 'bg-blue-900 text-blue-300',
        icon: Shield
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
        isDarkTheme ? config.darkBg : config.bg
      }`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const calculateTravelerReward = (markupAmount) => {
    return markupAmount * 0.6;
  };

  const calculateCompanyFee = (markupAmount) => {
    return markupAmount * 0.4;
  };

  // Filter payments to show escrow and released payments
  const escrowPayments = payments.filter(payment => payment.status === 'escrow');
  const releasedPayments = payments.filter(payment => payment.status === 'released');

  return (
    <PermissionGuard permission="edit_orders" fallback={
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Access denied. You need payment management permissions.</p>
      </div>
    }>
      <div className={`p-6 ${isDarkTheme ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" />
            Escrow Management
          </h2>
          <p className={`mt-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
            Review and release funds from escrow to travelers
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${isDarkTheme ? 'bg-gray-700' : 'bg-blue-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-blue-600'}`}>In Escrow</p>
                <p className="text-2xl font-bold">{escrowPayments.length}</p>
              </div>
              <Clock className={`w-8 h-8 ${isDarkTheme ? 'text-yellow-400' : 'text-yellow-500'}`} />
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${isDarkTheme ? 'bg-gray-700' : 'bg-green-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-green-600'}`}>Released</p>
                <p className="text-2xl font-bold">{releasedPayments.length}</p>
              </div>
              <CheckCircle className={`w-8 h-8 ${isDarkTheme ? 'text-green-400' : 'text-green-500'}`} />
            </div>
          </div>

          <div className={`p-4 rounded-lg ${isDarkTheme ? 'bg-gray-700' : 'bg-yellow-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-yellow-600'}`}>Total Escrow</p>
                <p className="text-2xl font-bold">
                  KES {escrowPayments.reduce((sum, p) => sum + p.totalAmount, 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className={`w-8 h-8 ${isDarkTheme ? 'text-yellow-400' : 'text-yellow-500'}`} />
            </div>
          </div>

          <div className={`p-4 rounded-lg ${isDarkTheme ? 'bg-gray-700' : 'bg-purple-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-purple-600'}`}>Pending Rewards</p>
                <p className="text-2xl font-bold">
                  KES {escrowPayments.reduce((sum, p) => sum + calculateTravelerReward(p.markupAmount), 0).toFixed(2)}
                </p>
              </div>
              <Shield className={`w-8 h-8 ${isDarkTheme ? 'text-purple-400' : 'text-purple-500'}`} />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Payments Awaiting Release */}
            {escrowPayments.length > 0 && (
              <div className={`rounded-lg border ${isDarkTheme ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    Payments Awaiting Release ({escrowPayments.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={isDarkTheme ? 'bg-gray-600' : 'bg-gray-50'}>
                      <tr>
                        <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Order</th>
                        <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Client</th>
                        <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Product</th>
                        <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Product Amount</th>
                        <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Markup</th>
                        <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Traveler Reward</th>
                        <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Company Fee</th>
                        <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Total</th>
                        <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Status</th>
                        <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className={isDarkTheme ? 'divide-gray-600' : 'divide-gray-200'}>
                      {escrowPayments.map((payment) => (
                        <tr key={payment._id} className={isDarkTheme ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}>
                          <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>
                            {payment.order?.orderNumber || payment.order?._id || 'N/A'}
                          </td>
                          <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>
                            {payment.client?.name || 'N/A'}
                          </td>
                          <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>
                            {payment.product?.productName || payment.product || 'N/A'}
                          </td>
                          <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>
                            KES {payment.productAmount?.toFixed(2) || '0.00'}
                          </td>
                          <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>
                            KES {payment.markupAmount?.toFixed(2) || '0.00'}
                          </td>
                          <td className={`p-3 text-green-600 font-semibold`}>
                            KES {calculateTravelerReward(payment.markupAmount).toFixed(2)}
                          </td>
                          <td className={`p-3 text-blue-600 font-semibold`}>
                            KES {calculateCompanyFee(payment.markupAmount).toFixed(2)}
                          </td>
                          <td className={`p-3 font-bold ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>
                            KES {payment.totalAmount?.toFixed(2) || '0.00'}
                          </td>
                          <td className="p-3">
                            {getStatusBadge(payment.status)}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                                type="text"
                                placeholder="Traveler ID"
                                value={selectedTravelers[payment._id] || ''}
                                onChange={(e) => handleTravelerChange(payment._id, e.target.value)}
                                className={`px-2 py-1 border rounded text-sm w-24 ${
                                  isDarkTheme 
                                    ? 'bg-gray-600 border-gray-500 text-white' 
                                    : 'bg-gray-100 border-gray-300'
                                }`} 
                              <button
                                onClick={() => handleReleaseFunds(payment._id)}
                                disabled={releaseLoading[payment._id] || !selectedTravelers[payment._id]}
                                className={`px-3 py-1 rounded text-sm font-medium flex items-center gap-1 ${
                                  releaseLoading[payment._id] || !selectedTravelers[payment._id]
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : isDarkTheme
                                    ? 'bg-green-700 hover:bg-green-800 text-white'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                              >
                                {releaseLoading[payment._id] ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                                    Releasing...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-3 h-3" />
                                    Release
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Released Payments History */}
            {releasedPayments.length > 0 && (
              <div className={`rounded-lg border ${isDarkTheme ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Released Payments ({releasedPayments.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={isDarkTheme ? 'bg-gray-600' : 'bg-gray-50'}>
                      <tr>
                        <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Order</th>
                        <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Client</th>
                        <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Traveler</th>
                        <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Total Amount</th>
                        <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Traveler Reward</th>
                        <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Company Fee</th>
                        <th className={`p-3 text-left ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Status</th>
                      </tr>
                    </thead>
                    <tbody className={isDarkTheme ? 'divide-gray-600' : 'divide-gray-200'}>
                      {releasedPayments.map((payment) => (
                        <tr key={payment._id} className={isDarkTheme ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}>
                          <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>
                            {payment.order?.orderNumber || payment.order?._id || 'N/A'}
                          </td>
                          <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>
                            {payment.client?.name || 'N/A'}
                          </td>
                          <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>
                            {payment.traveler || 'N/A'}
                          </td>
                          <td className={`p-3 font-bold ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>
                            KES {payment.totalAmount?.toFixed(2) || '0.00'}
                          </td>
                          <td className={`p-3 text-green-600 font-semibold`}>
                            KES {calculateTravelerReward(payment.markupAmount).toFixed(2)}
                          </td>
                          <td className={`p-3 text-blue-600 font-semibold`}>
                            KES {calculateCompanyFee(payment.markupAmount).toFixed(2)}
                          </td>
                          <td className="p-3">
                            {getStatusBadge(payment.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {payments.length === 0 && (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className={`text-lg ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  No payments to manage at this time
                </p>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-500' : 'text-gray-500'}`}>
                  Payments will appear here when orders are completed and processed
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};

export default PaymentManagementComponent;