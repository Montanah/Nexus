import React, { useState, useEffect } from 'react';
import { ShoppingCart, UserCheck, BarChart3, DollarSign } from 'lucide-react';
import StatCard from './StatCard';
import { processPayment } from '../api'; // Assuming this is in api.js

const OrdersComponent = ({ orders: initialOrders, setOrders, users, isDarkTheme }) => {
  const [orders, setLocalOrders] = useState(initialOrders);
  const [filters, setFilters] = useState({
    status: '',
    client: '',
    traveler: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync local orders with prop changes
  useEffect(() => {
    setLocalOrders(initialOrders);
  }, [initialOrders]);

  // Filter orders based on selected criteria
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = !filters.status || order.items.some((item) => item.deliveryStatus === filters.status);
    const matchesClient = !filters.client || getUserName(order.userId)?.toLowerCase().includes(filters.client.toLowerCase());
    const matchesTraveler = !filters.traveler || order.items.some((item) =>
      item.claimedBy && getUserName(item.claimedBy)?.toLowerCase().includes(filters.traveler.toLowerCase())
    );
    return matchesStatus && matchesClient && matchesTraveler;
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_transit: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      Complete: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getUserName = (userId) => {
    return users.find((u) => u._id === userId)?.name || 'Unknown';
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleProcessPayment = async (order) => {
    const completedItem = order.items.find((item) => item.deliveryStatus === 'Complete');
    if (!completedItem) return;

    setIsLoading(true);
    setError('');
    try {
      const paymentData = {
        clientId: order.userId,
        travelerId: completedItem.claimedBy,
        orderId: order._id,
        productId: completedItem.product,
        amount: order.totalAmount / order.items.length, 
        paymentMethod: order.paymentMethod, 
      };
      const response = await processPayment(paymentData);
      setOrders((prev) =>
        prev.map((o) =>
          o._id === order._id ? { ...o, paymentProcessed: true } : o
        )
      );
      setLocalOrders((prev) =>
        prev.map((o) =>
          o._id === order._id ? { ...o, paymentProcessed: true } : o
        )
      );
      alert('Payment processed and placed in escrow!');
    } catch (err) {
      setError('Failed to process payment. Please try again.');
      console.error('Process payment error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-6 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
      {/* Statistics Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
        <StatCard
          title="Total Orders"
          value={orders.length}
          icon={ShoppingCart}
          color="bg-gradient-to-r from-pink-500 to-pink-600"
          change={18}
          isDarkTheme={isDarkTheme}
        />
        <StatCard
          title="Delivered"
          value={orders.reduce((sum, o) => sum + o.items.filter((i) => i.deliveryStatus === 'Complete').length, 0)}
          icon={UserCheck}
          color="bg-gradient-to-r from-green-500 to-green-600"
          change={25}
          isDarkTheme={isDarkTheme}
        />
        <StatCard
          title="Revenue"
          value={`$${orders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}`}
          icon={BarChart3}
          color="bg-gradient-to-r from-emerald-500 to-emerald-600"
          change={31}
          isDarkTheme={isDarkTheme}
        />
      </div>

      {/* Filters */}
      <div className={`p-6 rounded-2xl shadow-lg border ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className={`p-2 border rounded ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300'}`}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
            <option value="Complete">Complete</option>
          </select>
          <input
            type="text"
            name="client"
            value={filters.client}
            onChange={handleFilterChange}
            placeholder="Filter by Client"
            className={`p-2 border rounded ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300'}`}
          />
          <input
            type="text"
            name="traveler"
            value={filters.traveler}
            onChange={handleFilterChange}
            placeholder="Filter by Traveler"
            className={`p-2 border rounded ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300'}`}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className={`rounded-2xl shadow-lg border overflow-hidden ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className={`p-6 border-b ${isDarkTheme ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Orders</h2>
          <p className={`text-gray-600 mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Track all delivery orders</p>
        </div>
        
        <div className={`overflow-x-auto ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
          <table className="w-full">
            <thead className={isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`text-left p-4 font-semibold ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Order ID</th>
                <th className={`text-left p-4 font-semibold ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Client</th>
                <th className={`text-left p-4 font-semibold ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Traveler</th>
                <th className={`text-left p-4 font-semibold ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Product</th>
                <th className={`text-left p-4 font-semibold ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Status</th>
                <th className={`text-left p-4 font-semibold ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Amount</th>
                <th className={`text-left p-4 font-semibold ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkTheme ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {filteredOrders.map((order) =>
                order.items.map((item, index) => (
                  <tr key={`${order._id}-${index}`} className={isDarkTheme ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors>
                    <td className={`p-4 font-mono text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      #{order._id}{index > 0 ? ` (Item ${index + 1})` : ''}
                    </td>
                    <td className={`p-4 font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      {getUserName(order.userId)}
                    </td>
                    <td className={`p-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-700'}`}>
                      {item.claimedBy ? getUserName(item.claimedBy) : 'Unassigned'}
                    </td>
                    <td className={`p-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-700'}`}>
                      {item.product}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.deliveryStatus)}`}>
                        {item.deliveryStatus}
                      </span>
                    </td>
                    <td className={`p-4 font-semibold ${isDarkTheme ? 'text-green-300' : 'text-green-600'}`}>
                      ${(order.totalAmount / order.items.length).toFixed(2)}
                    </td>
                    <td className="p-4">
                      {item.deliveryStatus === 'Complete' && !order.paymentProcessed && (
                        <button
                          onClick={() => handleProcessPayment(order)}
                          disabled={isLoading}
                          className={`flex items-center px-3 py-1 rounded text-sm ${
                            isDarkTheme
                              ? 'bg-blue-700 hover:bg-blue-800 text-white'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          {isLoading ? 'Processing...' : 'Process Payment'}
                        </button>
                      )}
                      {order.paymentProcessed && (
                        <span className="text-green-500 text-sm">Payment Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {error && <div className={`p-4 text-red-500 ${isDarkTheme ? 'bg-gray-700' : 'bg-red-100'}`}>{error}</div>}
      </div>
    </div>
  );
};

export default OrdersComponent;