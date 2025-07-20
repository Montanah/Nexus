import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Star, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  Activity,
  Edit,
  Ban,
  CheckCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { getTravelerDetails } from '../api';

const TravelerDetails = ({ isDarkTheme }) => {
  const { travelerId } = useParams();
  const navigate = useNavigate();
  const { admin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [traveler, setTraveler] = useState(null);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check permissions
  const canReadUsers = admin?.permissions?.includes('travelers.read') || admin?.permissions?.includes('all');
  const canWriteUsers = admin?.permissions?.includes('travelers.write') || admin?.permissions?.includes('all');

  useEffect(() => {
    const fetchTravelerDetails = async () => {
      try {
        setLoading(true);
        const response = await getTravelerDetails(travelerId);
        console.log(response);
        
        setTraveler(response.traveler);
        setUser(response.user);
        setProducts(response.products);
        setPayments(response.payments);
        
      } catch (error) {
        console.error('Error fetching traveler details:', error);
        setTraveler(null);
      } finally {
        setLoading(false);
      }
    };

    if (travelerId) {
      fetchTravelerDetails();
    }
  }, [travelerId]);

  if (!canReadUsers) {
    return (
      <div className="p-6">
        <p className="text-center text-red-500 font-semibold">
          You do not have permission to view traveler details.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className={`mt-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Loading traveler details...</p>
        </div>
      </div>
    );
  }

  if (!traveler) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`} />
          <h2 className={`text-2xl font-bold mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Traveler Not Found</h2>
          <p className={`mb-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>The traveler you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/users')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'products', label: 'Products', icon: Package, count: products.length },
    { id: 'payments', label: 'Payments', icon: CreditCard, count: payments.length },
    { id: 'activity', label: 'Activity', icon: Activity, count: traveler.history?.length || 0 }
  ];

  const getStatusColor = (isVerified) => {
    return isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getRoleColor = (role) => {
    return role === 'traveler' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  const getProductStatusColor = (status) => {
    const statusColors = {
      'Complete': 'bg-green-100 text-green-800',
      'Awaiting Client Confirmation': 'bg-yellow-100 text-yellow-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const statusColors = {
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800',
      'refunded': 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/travelers')}
              className={`p-2 rounded-lg ${isDarkTheme ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} transition-colors`}
            >
              <ArrowLeft className={`w-5 h-5 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`} />
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                Traveler Details
              </h1>
              <p className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                Complete profile and activity overview
              </p>
            </div>
          </div>
          
          {canWriteUsers && (
            <div className="flex space-x-3">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                <Edit className="w-4 h-4" />
                <span>Edit Traveler</span>
              </button>
              <button className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                user.isVerified 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}>
                {user.isVerified ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                <span>{user.isVerified ? 'Suspend' : 'Verify'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Traveler Profile Card */}
        <div className={`rounded-2xl shadow-lg border mb-6 ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="p-6">
            <div className="flex items-start space-x-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    {user.name}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(user.isVerified)}`}>
                    {user.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Mail className={`w-4 h-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`} />
                    <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className={`w-4 h-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`} />
                    <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>{user.phone_number}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className={`w-4 h-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`} />
                    <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                      {traveler.destination?.city || 'Not provided'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className={`w-4 h-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`} />
                    <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                      {new Date(traveler.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl text-center ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <ShoppingCart className={`w-6 h-6 mx-auto mb-2 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    {products.length}
                  </div>
                  <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Products</div>
                </div>
                <div className={`p-4 rounded-xl text-center ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <DollarSign className={`w-6 h-6 mx-auto mb-2 ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`} />
                  <div className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    KES {traveler.earnings.totalEarnings.toLocaleString()}
                  </div>
                  <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Earnings</div>
                </div>
                <div className={`p-4 rounded-xl text-center ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <Star className={`w-6 h-6 mx-auto mb-2 ${isDarkTheme ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  <div className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    {traveler.earnings.rating.average || 'N/A'}
                  </div>
                  <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`rounded-2xl shadow-lg border ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className={`flex border-b ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                    isActive
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : isDarkTheme
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      isActive
                        ? 'bg-blue-100 text-blue-800'
                        : isDarkTheme
                          ? 'bg-gray-600 text-gray-200'
                          : 'bg-gray-200 text-gray-800'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      Personal Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>Full Name:</span>
                        <span className={isDarkTheme ? 'text-white' : 'text-gray-900'}>{user.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>Email:</span>
                        <span className={isDarkTheme ? 'text-white' : 'text-gray-900'}>{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>Phone:</span>
                        <span className={isDarkTheme ? 'text-white' : 'text-gray-900'}>{user.phone_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>Role:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(user.isVerified)}`}>
                          {user.isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>Member Since:</span>
                        <span className={isDarkTheme ? 'text-white' : 'text-gray-900'}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      Traveler Earnings
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>Total Earnings:</span>
                        <span className={isDarkTheme ? 'text-white' : 'text-gray-900'}>KES {traveler.earnings.totalEarnings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>Pending Payments:</span>
                        <span className={isDarkTheme ? 'text-white' : 'text-gray-900'}>KES {traveler.earnings.pendingPayments.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>Average Rating:</span>
                        <span className={isDarkTheme ? 'text-white' : 'text-gray-900'}>{traveler.earnings.rating.average || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>Rating Count:</span>
                        <span className={isDarkTheme ? 'text-white' : 'text-gray-900'}>{traveler.earnings.rating.count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                  Products ({products.length})
                </h3>
                {products.length > 0 ? (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <div key={product._id} className={`p-4 rounded-lg border ${isDarkTheme ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <Package className={`w-5 h-5 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`} />
                            <span className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                              {product.productName}
                            </span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getProductStatusColor(product.deliveryStatus)}`}>
                            {product.deliveryStatus}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>Destination: </span>
                            <span className={isDarkTheme ? 'text-white' : 'text-gray-900'}>
                              {`${product.destination.city}, ${product.destination.country}`}
                            </span>
                          </div>
                          <div>
                            <span className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>Delivery Date: </span>
                            <span className={isDarkTheme ? 'text-white' : 'text-gray-900'}>
                              {new Date(product.deliverydate).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>Reward: </span>
                            <span className={isDarkTheme ? 'text-white' : 'text-gray-900'}>
                              KES {product.rewardAmount || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className={`w-12 h-12 mx-auto mb-4 ${isDarkTheme ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>No products found for this traveler</p>
                  </div>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                  Payments ({payments.length})
                </h3>
                {payments.length > 0 ? (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <div key={payment._id} className={`p-4 rounded-lg border ${isDarkTheme ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <CreditCard className={`w-5 h-5 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`} />
                            <span className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                              Payment #{payment.transactionId || payment._id}
                            </span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPaymentStatusColor(payment.status)}`}>
                            {payment.status || 'N/A'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>Date: </span>
                            <span className={isDarkTheme ? 'text-white' : 'text-gray-900'}>
                              {new Date(payment.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>Amount: </span>
                            <span className={isDarkTheme ? 'text-white' : 'text-gray-900'}>
                              ${payment.amount || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className={`w-12 h-12 mx-auto mb-4 ${isDarkTheme ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>No payments found for this traveler</p>
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {traveler.history?.length > 0 ? (
                    traveler.history.map((item, index) => (
                      <div key={index} className={`flex items-start space-x-4 p-4 rounded-lg ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                          <ShoppingCart className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                            Order #{item.orderId}
                          </div>
                          <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                            {new Date(traveler.updatedAt).toLocaleDateString()} - KES {item.rewardAmount || 0}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getProductStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Activity className={`w-12 h-12 mx-auto mb-4 ${isDarkTheme ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>No recent activity found for this traveler</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelerDetails;