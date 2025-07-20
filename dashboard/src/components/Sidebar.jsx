import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  X, 
  Sun, 
  Moon, 
  Settings, 
  BadgeCent, 
  User, 
  LogOut, 
  Edit,
  Home,
  Activity
} from 'lucide-react';
import { useAuth } from '../AuthContext';

const Sidebar = ({ setActiveTab, activeTab, isSidebarOpen, setIsSidebarOpen, users, products, orders, travelers, isDarkTheme, toggleTheme }) => {
  const navigate = useNavigate();
  const { admin, logout } = useAuth();

  const handleNavigate = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
    
    switch (tab) {
      case 'dashboard':
        navigate('/');
        break;
      case 'users':
        navigate('/users');
        break;
      case 'products':
        navigate('/products');
        break;
      case 'orders':
        navigate('/orders');
        break;
      case 'travelers':
        navigate('/travelers');
        break;
      case 'admin':
        navigate('/admins');
        break;
      case 'payment':
        navigate('/payments');
        break;
      case 'analytics':
        navigate('/analytics');
        break;
      case 'transactions':
        navigate('/transactions');
        break;
      case 'view-profile':
        navigate('/profile');
        break;
      case 'edit-profile':
        navigate('/edit-profile');
        break;
      case 'logout':
        logout(); 
        navigate('/login');
        break;
      default:
        navigate('/');
    }
  };

  // Check permissions - Updated to handle both general and specific permissions
  const hasUsersAccess = admin?.permissions?.includes('users') || 
                        admin?.permissions?.includes('users.read') || 
                        admin?.permissions?.includes('users.write') || 
                        admin?.permissions?.includes('all');
  
  const hasProductsAccess = admin?.permissions?.includes('products') || 
                           admin?.permissions?.includes('products.read') || 
                           admin?.permissions?.includes('products.write') || 
                           admin?.permissions?.includes('all');
  
  const hasOrdersAccess = admin?.permissions?.includes('orders') || 
                         admin?.permissions?.includes('orders.read') || 
                         admin?.permissions?.includes('orders.write') || 
                         admin?.permissions?.includes('all');
  
  const hasTravelersAccess = admin?.permissions?.includes('travelers') || 
                            admin?.permissions?.includes('travelers.read') || 
                            admin?.permissions?.includes('travelers.write') || 
                            admin?.permissions?.includes('all');
  
  const hasAnalyticsAccess = admin?.permissions?.includes('analytics') || 
                            admin?.permissions?.includes('analytics.read') || 
                            admin?.permissions?.includes('analytics.write') || 
                            admin?.permissions?.includes('all');
  
  const hasAdminAccess = admin?.permissions?.includes('admin') || 
                        admin?.permissions?.includes('admin.read') || 
                        admin?.permissions?.includes('admin.write') || 
                        admin?.permissions?.includes('all') || 
                        admin?.role === 'superadmin';
  
  const hasPaymentsAccess = admin?.permissions?.includes('payments') || 
                           admin?.permissions?.includes('payments.read') || 
                           admin?.permissions?.includes('payments.write') || 
                           admin?.permissions?.includes('all');
  
  const hasTransactionsAccess = admin?.permissions?.includes('transactions') || 
                               admin?.permissions?.includes('transactions.read') || 
                               admin?.permissions?.includes('transactions.write') || 
                               admin?.permissions?.includes('all');

  const menuItems = [
    { 
      id: 'dashboard', 
      icon: Home, 
      label: 'Dashboard',
      hasAccess: true // Dashboard should be accessible to all
    },
    { 
      id: 'users', 
      icon: Users, 
      label: 'Users', 
      count: Array.isArray(users) ? users.length : 0,
      hasAccess: hasUsersAccess
    },
    { 
      id: 'products', 
      icon: Package, 
      label: 'Products', 
      count: Array.isArray(products) ? products.length : 0,
      hasAccess: hasProductsAccess
    },
    { 
      id: 'orders', 
      icon: ShoppingCart, 
      label: 'Orders', 
      count: Array.isArray(orders) ? orders.length : 0,
      hasAccess: hasOrdersAccess
    },
    { 
      id: 'travelers', 
      icon: Users, 
      label: 'Travelers',
      count: Array.isArray(travelers) ? travelers.length : 0,
      hasAccess: hasTravelersAccess
    },
    { 
      id: 'transactions', 
      icon: Activity, 
      label: 'Transactions',
      hasAccess: hasTransactionsAccess
    },
    { 
      id: 'payment', 
      icon: BadgeCent, 
      label: 'Payments',
      hasAccess: hasPaymentsAccess
    },
    { 
      id: 'analytics', 
      icon: BarChart3, 
      label: 'Analytics',
      hasAccess: hasAnalyticsAccess
    },
    { 
      id: 'admin', 
      icon: Settings, 
      label: 'Admin Management',
      hasAccess: hasAdminAccess
    }
  ];

  const profileItems = [
    { id: 'view-profile', icon: User, label: 'View Profile' },
    { id: 'edit-profile', icon: Edit, label: 'Edit Profile' },
    { id: 'logout', icon: LogOut, label: 'Logout' }
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <div className={`fixed left-0 top-0 h-full w-72 ${
        isDarkTheme 
          ? 'bg-gray-900 text-white' 
          : 'bg-gray-100 text-gray-900'
      } z-50 transform transition-transform duration-300 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 shadow-2xl`}>
        
        {/* Header */}
        <div className={`p-6 border-b ${isDarkTheme ? 'border-gray-800' : 'border-gray-300'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8 8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                </svg>
              </div>
              <div>
                <h1 className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                  Nexus Admin
                </h1>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Delivery Platform
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${
                  isDarkTheme ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                } transition-colors`}
                aria-label={isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {isDarkTheme ? (
                  <Sun className={`w-5 h-5 ${isDarkTheme ? 'text-white' : 'text-gray-600'}`} />
                ) : (
                  <Moon className={`w-5 h-5 ${isDarkTheme ? 'text-white' : 'text-gray-600'}`} />
                )}
              </button>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className={`lg:hidden p-2 rounded-lg ${
                  isDarkTheme ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                } transition-colors`}
              >
                <X className={`w-5 h-5 ${isDarkTheme ? 'text-white' : 'text-gray-600'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            // Don't render items the user doesn't have access to
            if (!item.hasAccess) return null;
            
            const Icon = item.icon;
            const isActive = activeTab === item.id || (activeTab === '' && item.id === 'dashboard');
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' 
                    : isDarkTheme 
                      ? 'bg-gray-800 bg-opacity-50 hover:bg-gray-700 hover:scale-105 text-white' 
                      : 'bg-white hover:bg-gray-200 hover:scale-105 text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    isActive
                      ? 'bg-white bg-opacity-30 text-white' 
                      : isDarkTheme 
                        ? 'bg-gray-600 text-gray-200' 
                        : 'bg-gray-300 text-gray-800'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`absolute bottom-0 left-0 right-0 p-6 border-t ${isDarkTheme ? 'border-gray-800' : 'border-gray-300'}`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {admin?.name ? admin.name.charAt(0).toUpperCase() : 'AD'}
              </span>
            </div>
            <div>
              <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                {admin?.name || 'Admin User'}
              </p>
              <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                {admin?.email || 'admin@nexus.com'}
              </p>
            </div>
          </div>
        </div> 
      </div>
    </>
  );
};

export default Sidebar;