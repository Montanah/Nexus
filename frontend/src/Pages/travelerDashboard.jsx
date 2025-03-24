import { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getTravelerOrders, getTravelerEarnings, getTravelerHistory } from '../Services/api';
import Sidebar from '../Components/Sidebar';
import UserProfile from '../Components/UserProfile';

const TravelerDashboard = () => {
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({ category: 'All', destination: 'All', priceMin: '', priceMax: '', urgency: '' });
  const [earnings, setEarnings] = useState({ totalEarnings: '0.00', pendingPayments: '0.00', rating: { average: 0, count: 0 } });
  const [history, setHistory] = useState([]);
  const [period, setPeriod] = useState('all');

  // Mock filter options (could be fetched from API in a real app)
  const categoryOptions = ['All', 'Electronics', 'Accessories', 'Clothing'];
  const destinationOptions = ['All', 'USA, New York', 'UK, London', 'Canada, Toronto'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersResponse = await getTravelerOrders(filters);
        const earningsResponse = await getTravelerEarnings(userId, { period });
        const historyResponse = await getTravelerHistory(userId);

        setOrders(ordersResponse.data.orders);
        setEarnings(earningsResponse.data);
        setHistory(historyResponse.data.history);
      } catch (error) {
        console.error('Error fetching traveler data:', error);
      }
    };
    fetchData();
  }, [filters, userId, period]);

  const handleViewDetails = (orderNumber) => {
    navigate(`/order-details/${orderNumber}`);
  };

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 flex flex-col lg:flex-row relative">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 md:p-8 pb-24 sm:pb-28 md:pb-32 lg:ml-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-6">Orders for Fulfillment</h1>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {categoryOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            value={filters.destination}
            onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {destinationOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Min Price"
            value={filters.priceMin}
            onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={filters.priceMax}
            onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <select
            value={filters.urgency}
            onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Urgency</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* Swipeable Order List */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-blue-600 mb-4">Available Orders</h2>
          <div className="flex overflow-x-auto space-x-4 pb-4">
            {orders.length === 0 ? (
              <p className="text-gray-600">No orders available.</p>
            ) : (
              orders.map(order => (
                <div
                  key={order.orderNumber}
                  className="flex-shrink-0 w-64 bg-gray-50 p-4 rounded-md border shadow-sm"
                >
                  {order.productPhotos && order.productPhotos.length > 0 ? (
                    <img
                      src={order.productPhotos[0]} // Use first photo if available
                      alt={order.productName}
                      className="w-full h-32 object-cover rounded-md mb-2"
                    />
                  ) : null}
                  <p className="font-medium text-gray-700">{order.productName}</p>
                  <p className="text-sm text-gray-600">{`${order.deliveryDestination.country}, ${order.deliveryDestination.city}`}</p>
                  <p className="text-sm text-gray-600">Reward: ${order.rewardAmount}</p>
                  <p className="text-sm text-gray-600">Urgency: {order.urgencyLevel}</p>
                  <p className="text-sm text-gray-600">Price: ${order.price}</p>
                  <button
                    onClick={() => handleViewDetails(order.orderNumber)}
                    className="mt-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                  >
                    View Details
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Total Earnings Overview */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-blue-600">Total Earnings Overview</h2>
            <select
              value={period}
              onChange={handlePeriodChange}
              className="ml-4 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <p className="text-gray-700 mb-4">Total Earnings: ${earnings.totalEarnings}</p>
          <h3 className="text-lg font-medium text-blue-600 mb-2">Pending Escrow Amount</h3>
          <p className="text-gray-700 mb-4">Pending Escrow Amount: ${earnings.pendingPayments}</p>
          <h3 className="text-lg font-medium text-blue-600 mb-2">Ratings</h3>
          <p className="text-gray-700 mb-4">Rating: {earnings.rating.average.toFixed(1)} ({earnings.rating.count} reviews)</p>
          <button
            onClick={() => navigate('/traveler-history')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            View Account History
          </button>
        </div>
      </div>

      {/* User Profile */}
      <UserProfile userId={userId} />
    </div>
  );
};

export default TravelerDashboard;