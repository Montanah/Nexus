import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign, 
  Activity,
  ArrowUpRight,
  Calendar,
  Clock
} from 'lucide-react';
import { useAuth } from '../AuthContext';

const DashboardLanding = ({ users, products, orders, travelers, isDarkTheme }) => {
  const navigate = useNavigate();
  const { admin } = useAuth();

  // Calculate statistics
  const totalUsers = Array.isArray(users) ? users.length : 0;
  const totalProducts = Array.isArray(products) ? products.length : 0;
  const totalOrders = Array.isArray(orders) ? orders.length : 0;
  const totalTravelers = Array.isArray(travelers) ? travelers.length : 0;

  // Calculate recent activity (mock data for demonstration)
  const recentOrders = Array.isArray(orders) ? orders.slice(0, 3) : [];
  const pendingOrders = Array.isArray(orders) ? orders.filter(order => order.status === 'pending').length : 0;

  // Check permissions for different sections
  const hasUsersAccess = admin?.permissions?.includes('users') || admin?.permissions?.includes('all');
  const hasProductsAccess = admin?.permissions?.includes('products') || admin?.permissions?.includes('all');
  const hasOrdersAccess = admin?.permissions?.includes('orders') || admin?.permissions?.includes('all');
  const hasTravelersAccess = admin?.permissions?.includes('travelers') || admin?.permissions?.includes('all');
  const hasAnalyticsAccess = admin?.permissions?.includes('analytics') || admin?.permissions?.includes('all');

  const statsCards = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      route: '/users',
      hasAccess: hasUsersAccess,
      change: '+12%'
    },
    {
      title: 'Products',
      value: totalProducts,
      icon: Package,
      color: 'from-green-500 to-green-600',
      route: '/products',
      hasAccess: hasProductsAccess,
      change: '+8%'
    },
    {
      title: 'Orders',
      value: totalOrders,
      icon: ShoppingCart,
      color: 'from-purple-500 to-purple-600',
      route: '/orders',
      hasAccess: hasOrdersAccess,
      change: '+23%'
    },
    {
      title: 'Travelers',
      value: totalTravelers,
      icon: Activity,
      color: 'from-orange-500 to-orange-600',
      route: '/travelers',
      hasAccess: hasTravelersAccess,
      change: '+15%'
    }
  ];

  const quickActions = [
    {
      title: 'Add New Product',
      description: 'Create a new product listing',
      icon: Package,
      route: '/products',
      hasAccess: hasProductsAccess,
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      title: 'View Analytics',
      description: 'Check performance metrics',
      icon: TrendingUp,
      route: '/analytics',
      hasAccess: hasAnalyticsAccess,
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      title: 'Manage Orders',
      description: 'Review pending orders',
      icon: ShoppingCart,
      route: '/orders',
      hasAccess: hasOrdersAccess,
      color: 'from-rose-500 to-rose-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className={`rounded-2xl p-6 ${
        isDarkTheme 
          ? 'bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-700' 
          : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${
              isDarkTheme ? 'text-white' : 'text-gray-900'
            }`}>
              Welcome back, {admin?.name || 'Admin'}!
            </h1>
            <p className={`mt-2 ${
              isDarkTheme ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Here's what's happening with your delivery platform today.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          if (!stat.hasAccess) return null;
          
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              onClick={() => navigate(stat.route)}
              className={`p-6 rounded-xl cursor-pointer transform hover:scale-105 transition-all duration-200 ${
                isDarkTheme 
                  ? 'bg-gray-800 border border-gray-700 hover:border-gray-600' 
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              } shadow-lg hover:shadow-xl`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    isDarkTheme ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {stat.title}
                  </p>
                  <p className={`text-3xl font-bold mt-2 ${
                    isDarkTheme ? 'text-white' : 'text-gray-900'
                  }`}>
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className="text-green-500 text-sm font-medium">
                      {stat.change}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-green-500 ml-1" />
                  </div>
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions Panel */}
        <div className={`p-6 rounded-xl ${
          isDarkTheme 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        } shadow-lg`}>
          <h2 className={`text-xl font-semibold mb-4 ${
            isDarkTheme ? 'text-white' : 'text-gray-900'
          }`}>
            Quick Actions
          </h2>
          <div className="space-y-3">
            {quickActions.map((action) => {
              if (!action.hasAccess) return null;
              
              const Icon = action.icon;
              return (
                <button
                  key={action.title}
                  onClick={() => navigate(action.route)}
                  className={`w-full p-4 rounded-lg text-left hover:scale-102 transform transition-all duration-200 ${
                    isDarkTheme 
                      ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600' 
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className={`font-medium ${
                        isDarkTheme ? 'text-white' : 'text-gray-900'
                      }`}>
                        {action.title}
                      </h3>
                      <p className={`text-sm ${
                        isDarkTheme ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {action.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className={`p-6 rounded-xl ${
          isDarkTheme 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        } shadow-lg`}>
          <h2 className={`text-xl font-semibold mb-4 ${
            isDarkTheme ? 'text-white' : 'text-gray-900'
          }`}>
            Recent Activity
          </h2>
          <div className="space-y-4">
            {/* Pending Orders Alert */}
            {hasOrdersAccess && pendingOrders > 0 && (
              <div className={`p-4 rounded-lg ${
                isDarkTheme 
                  ? 'bg-orange-900/20 border border-orange-800' 
                  : 'bg-orange-50 border border-orange-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className={`font-medium ${
                      isDarkTheme ? 'text-orange-400' : 'text-orange-800'
                    }`}>
                      {pendingOrders} Pending Orders
                    </p>
                    <p className={`text-sm ${
                      isDarkTheme ? 'text-orange-300' : 'text-orange-600'
                    }`}>
                      Require immediate attention
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Items */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-opacity-50">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className={`text-sm ${
                    isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    New user registered
                  </p>
                  <p className={`text-xs ${
                    isDarkTheme ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    2 minutes ago
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-opacity-50">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className={`text-sm ${
                    isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Product inventory updated
                  </p>
                  <p className={`text-xs ${
                    isDarkTheme ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    15 minutes ago
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-opacity-50">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div>
                  <p className={`text-sm ${
                    isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Order completed successfully
                  </p>
                  <p className={`text-xs ${
                    isDarkTheme ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    1 hour ago
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role-based Welcome Message */}
      {admin?.role && (
        <div className={`p-4 rounded-lg ${
          isDarkTheme 
            ? 'bg-blue-900/20 border border-blue-800' 
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <p className={`text-sm ${
            isDarkTheme ? 'text-blue-300' : 'text-blue-700'
          }`}>
            You're logged in as <span className="font-medium capitalize">{admin.role}</span>
            {admin.permissions && admin.permissions.length > 0 && (
              <span className="ml-2">
                with access to: {admin.permissions.join(', ')}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardLanding;