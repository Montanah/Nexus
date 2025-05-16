import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Components/Sidebar';
import UserProfile from '../Components/UserProfile';
import { FaSearch, FaPlus, FaBox } from 'react-icons/fa';
import { useAuth } from '../Context/AuthContext';
import { fetchOrders, updateDeliveryStatus } from '../Services/api';

const ClientDashboard = () => {
  const navigate = useNavigate();
  const {userId, loading: authLoading } = useAuth(); // Rename to avoid confusion
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(true); // Renamed for clarity
  const [error, setError] = useState(null);

  // Fetch orders on mount
  useEffect(() => {
    const loadOrders = async () => {
      if (authLoading) return;
      if (!userId) {
        navigate('/login');
        return;
      }
      try {
        setOrderLoading(true);
        const fetchedOrders = await fetchOrders(userId);
        console.log('Fetched orders:', fetchedOrders?.data?.orders);
        setOrders(fetchedOrders?.data?.orders || []);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Failed to load orders');
      } finally {
        setOrderLoading(false);
      }
    };
    loadOrders();
  }, [userId, authLoading, navigate]);

  // const filteredOrders = orders.filter(order =>
  //   order.itemName?.toLowerCase().includes(searchQuery.toLowerCase())
  // );
  const filteredOrders = Array.isArray(orders)
    ? orders.filter(order => 
        order.items.some(item =>
          item.product.productName.toLowerCase().includes(searchQuery.toLowerCase())
        ),)
    : [];

  const handleOrderClick = (order) => {
    setSelectedOrder(selectedOrder?.id === order._id ? null : order);
  };

  const handleConfirmDelivery = async (orderId, deliveryId) => {
    try {
      const order = orders.find(o => o.id === orderId);
      const currentStatus = order.deliveryStatus;
      let newStatus = 'client_confirmed';
      if (currentStatus === 'traveler_confirmed') {
        newStatus = 'delivered';
      }
      const updatedOrder = await updateDeliveryStatus(deliveryId, newStatus);
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, deliveryStatus: updatedOrder.deliveryStatus, delivered: newStatus === 'delivered' } : o))
      );
      setSelectedOrder(prev => (prev?.id === orderId ? { ...prev, deliveryStatus: updatedOrder.deliveryStatus, delivered: newStatus === 'delivered' } : prev));
    } catch (err) {
      setError('Failed to confirm delivery: ' + err.message);
    }
  };

  const handleRateTraveler = (orderId) => {
    navigate(`/rate-product/${orderId}`, { state: { isTraveler: false } });
  };

  // Early returns after hooks
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 flex flex-col lg:flex-row relative">
      <Sidebar />
      <div className="flex-1 p-4 sm:p-6 md:p-8 pb-24 sm:pb-28 md:pb-32 lg:ml-0">
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
            {orderLoading ? (
              <p className="text-gray-600 text-center">Loading orders...</p>
            ) : error ? (
              <p className="text-red-600 text-center">{error}</p>
            ) : filteredOrders.length === 0 ? (
              <p className="text-gray-600 text-center">No orders found.</p>
            ) : (
              <ul className="space-y-4">
                {filteredOrders.map((order) => (
                  <li key={order._id} className="border-b pb-4">
                    <div
                      onClick={() => handleOrderClick(order)}
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-2 rounded"
                    >
                       <span className="text-gray-700 font-medium">{order.orderNumber}</span>
                      <div className="flex items-center">
                        {order.items[0]?.product?.productPhotos[0] ? (
                          <img src={order.items[0]?.product?.productPhotos[0]} 
                            alt={order.items[0]?.product?.productName} className="w-12 h-12 object-cover rounded mr-4" />
                        ) : (
                          <FaBox className="text-indigo-600 text-2xl mr-4" />
                        )}
                          {order.items.map((item, index) => (
                            <div key={index} className='text-gray-700 font-medium'>
                              {item.product.productName} (Qty: {item.quantity})
                               <span className="text-gray-600">Unit: KES{item.product.totalPrice.toFixed(2)}</span>
                            </div>
                          ))} 
                
                        {/* <span className="text-gray-700 font-medium">{order.itemName}</span> */}
                      </div>
                      <div className="flex space-x-6">
                        {/* <span className="text-gray-600">Qty: {order.quantity}</span> */}
                        {/* <span className="text-gray-600">Unit: ${order.unitPrice.toFixed(2)}</span> */}
                        <span className="text-indigo-600 font-semibold">Total: KES {order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                    {selectedOrder?._id === order._id && (
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
              <div className="bg-white rounded-xl shadow-md p-6 w-1/2">
                <h3 className="text-lg font-semibold text-indigo-900 mb-4">Order Progress</h3>
                <div className="relative">
                  {[
                    { label: 'Order Created', value: selectedOrder.createdDate || 'Pending' },
                    { label: 'Payment Status', value: selectedOrder.paymentStatus || 'Pending' },
                    { label: 'Date to be Delivered', value: selectedOrder.deliveryDate || 'TBD' },
                    { label: 'Delivered', value: selectedOrder.delivered ? 'Yes' : 'No' },
                    { label: 'Delivery Status', value: selectedOrder.deliveryStatus || 'Pending' },
                  ].map((step, index) => (
                    <div key={index} className="flex items-start mb-6 relative">
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
                        {index < 4 && (
                          <div className="h-10 w-px bg-gray-300 absolute top-6 left-2.5" />
                        )}
                      </div>
                      <div>
                        <p className="text-gray-700 font-medium">{step.label}</p>
                        <p className="text-gray-600">{step.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedOrder.deliveryStatus !== 'delivered' && (
                  <button
                    onClick={() => handleConfirmDelivery(selectedOrder.id, selectedOrder.deliveryId)}
                    className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    disabled={selectedOrder.deliveryStatus === 'client_confirmed'}
                  >
                    {selectedOrder.deliveryStatus === 'client_confirmed' ? 'Awaiting Traveler' : 'Confirm Delivery'}
                  </button>
                )}
                {selectedOrder.deliveryStatus === 'delivered' && (
                  <button
                    onClick={() => handleRateTraveler(selectedOrder.id)}
                    className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Rate Traveler
                  </button>
                )}
              </div>
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
      <UserProfile userId={userId} />
    </div>
  );
};

export default ClientDashboard;