import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Components/Sidebar';
import UserProfile from '../Components/UserProfile'; 
import { FaSearch, FaPlus, FaBox } from 'react-icons/fa';
import { useAuth } from '../Context/AuthContext';
import { fetchOrders } from '../Services/api';

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch orders on mount
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const fetchedOrders = await fetchOrders(userId);
        setOrders(fetchedOrders);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [userId]);

  const filteredOrders = orders.filter(order =>
    order.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOrderClick = (order) => {
    setSelectedOrder(selectedOrder?.id === order.id ? null : order);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 flex flex-col lg:flex-row relative">
      <Sidebar />
      <div className="flex-1 p-4 sm:p-6 md:p-8 pb-24 sm:pb-28 md:pb-32 lg:ml-0">
        {/* <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4"> */}
        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Search Bar and New Order Button */}
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-1/2">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => navigate('/new-order')}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg"
            >
              <FaPlus className="mr-2" /> New Order
            </button>
          </div>

          {/* Order List */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-indigo-900 mb-4">Order List</h2>
            {loading ? (
              <p className="text-gray-600 text-center">Loading orders...</p>
            ) : filteredOrders.length === 0 ? (
              <p className="text-gray-600 text-center">No orders found.</p>
            ) : (
              <ul className="space-y-4">
                {filteredOrders.map((order) => (
                  <li key={order.id} className="border-b pb-4">
                    <div
                      onClick={() => handleOrderClick(order)}
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-2 rounded"
                    >
                      <div className="flex items-center">
                        {order.photo ? (
                          <img src={order.photo} alt={order.itemName} className="w-12 h-12 object-cover rounded mr-4" />
                        ) : (
                          <FaBox className="text-indigo-600 text-2xl mr-4" />
                        )}
                        <span className="text-gray-700 font-medium">{order.itemName}</span>
                      </div>
                      <div className="flex space-x-6">
                        <span className="text-gray-600">Qty: {order.quantity}</span>
                        <span className="text-gray-600">Unit: ${order.unitPrice.toFixed(2)}</span>
                        <span className="text-indigo-600 font-semibold">Total: ${order.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                    {selectedOrder?.id === order.id && (
                      <div className="mt-2 pl-16 text-gray-600 text-sm">
                        <p>{order.details || 'No additional details provided.'}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Order Progress and Traveler Info */}
          {selectedOrder && (
            <div className="flex mt-6 gap-6">
              {/* Order Progress Card */}
              <div className="bg-white rounded-xl shadow-md p-6 w-1/2">
                <h3 className="text-lg font-semibold text-indigo-900 mb-4">Order Progress</h3>
                <div className="relative">
                  {[
                    { label: 'Order Created', value: selectedOrder.createdDate || 'Pending' },
                    { label: 'Payment Status', value: selectedOrder.paymentStatus || 'Pending' },
                    { label: 'Date to be Delivered', value: selectedOrder.deliveryDate || 'TBD' },
                    { label: 'Delivered', value: selectedOrder.delivered ? 'Yes' : 'No' },
                  ].map((step, index) => (
                    <div key={index} className="flex items-start mb-6 relative">
                      {/* Number Circle */}
                      <div className="flex flex-col items-center mr-4">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${
                            step.value !== 'Pending' && step.value !== 'No' && step.value !== 'TBD'
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                          }`}
                        >
                          {index + 1}
                        </div>
                        {index < 3 && (
                          <div className="h-10 w-px bg-gray-300 absolute top-6 left-2.5" />
                        )}
                      </div>
                      {/* Label and Value */}
                      <div>
                        <p className="text-gray-700 font-medium">{step.label}</p>
                        <p className="text-gray-600">{step.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Traveler Info */}
              <div className="bg-white rounded-xl shadow-md p-6 w-1/2">
                <h3 className="text-lg font-semibold text-indigo-900 mb-4">Traveler Information</h3>
                <p className="text-gray-900 font-medium">Traveler Name</p>
                <p className="text-gray-600 mb-2">{selectedOrder.travelerName || 'Not assigned'}</p>
                <p className="text-gray-900 font-medium">Estimated Delivery Date</p>
                <p className="text-gray-600">{selectedOrder.estimatedDeliveryDate || 'TBD'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <div>
      <UserProfile userId={userId} />
      </div>
    </div>
  );
};

export default ClientDashboard;