import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

import Sidebar from './components/Sidebar';
import { Menu, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import LoginPage from './pages/LoginPage';
import MainRouter from './MainRouter';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLanding from './components/DashboardLanding';

import { fetchUsers, fetchProducts, fetchOrders, fetchTravelers } from './api';

const AppContent = ({ isAuthenticated }) => {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [travelers, setTravelers] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { admin, logout } = useAuth();
  const dropdownRef = useRef(null);

  const toggleTheme = () => setIsDarkTheme(!isDarkTheme);

  const location = useLocation();
  const activeTab = location.pathname.slice(1) || 'dashboard';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [usersData, productsData, ordersData, travelersData] = await Promise.all([
          fetchUsers().catch(() => []),
          fetchProducts().catch(() => []),
          fetchOrders().catch(() => []),
          fetchTravelers().catch(() => [])
        ]);

        setUsers(usersData);
        setProducts(productsData);
        setOrders(ordersData);
        setTravelers(travelersData);
      } catch (error) {
        console.error('Error fetching data:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminData');
          localStorage.removeItem('isAuthenticated');
          logout();
          window.location.href = '/login';
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, logout]);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
      case '':
        return 'Dashboard';
      case 'users':
        return 'Users';
      case 'products':
        return 'Products';
      case 'orders':
        return 'Orders';
      case 'travelers':
        return 'Travelers';
      case 'admins':
        return 'Admin Management';
      case 'payments':
        return 'Payments';
      case 'analytics':
        return 'Analytics';
      case 'transactions':
        return 'Transactions';
      case 'profile':
        return 'Profile';
      case 'edit-profile':
        return 'Edit Profile';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={() => {}}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        users={users}
        products={products}
        travelers={travelers}
        orders={orders}
        isDarkTheme={isDarkTheme}
        toggleTheme={toggleTheme}
      />

      <div className="lg:ml-72 transition-all duration-300">
        <header className={`shadow-sm border-b ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 lg:p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Menu className={`w-6 h-6 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`} />
              </button>
              <div>
                <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
                {activeTab === 'dashboard' || activeTab === '' ? (
                  <p className={`text-sm mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                    Overview of your delivery platform
                  </p>
                ) : null}
              </div>
            </div>
            
            {/* Admin Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                  isDarkTheme ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {admin?.name ? admin.name.charAt(0).toUpperCase() : 'AD'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className={`text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    {admin?.name || 'Admin User'}
                  </p>
                  <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                    {admin?.role ? admin.role.charAt(0).toUpperCase() + admin.role.slice(1) : 'Administrator'}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''} ${
                  isDarkTheme ? 'text-gray-400' : 'text-gray-600'
                }`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg border z-50 ${
                  isDarkTheme 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className={`p-3 border-b ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                      {admin?.name || 'Admin User'}
                    </p>
                    <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      {admin?.email || 'admin@nexus.com'}
                    </p>
                    {admin?.role && (
                      <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                        isDarkTheme 
                          ? 'bg-blue-900/50 text-blue-300' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
                      </span>
                    )}
                  </div>
                  
                  <div className="py-2">
                    <button
                      onClick={() => {
                        window.location.href = '/profile';
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-opacity-10 transition-colors ${
                        isDarkTheme 
                          ? 'text-gray-300 hover:bg-gray-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span>View Profile</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        window.location.href = '/edit-profile';
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-opacity-10 transition-colors ${
                        isDarkTheme 
                          ? 'text-gray-300 hover:bg-gray-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </button>
                    
                    <div className={`my-1 border-t ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}></div>
                    
                    <button
                      onClick={handleLogout}
                      className={`w-full px-4 py-2 text-left flex items-center space-x-3 text-red-500 hover:bg-red-500 hover:bg-opacity-10 transition-colors`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Show Dashboard Landing for root route */}
              {(activeTab === 'dashboard' || activeTab === '') ? (
                <DashboardLanding
                  users={users}
                  products={products}
                  orders={orders}
                  travelers={travelers}
                  isDarkTheme={isDarkTheme}
                />
              ) : (
                <MainRouter
                  users={users}
                  setUsers={setUsers}
                  products={products}
                  setProducts={setProducts}
                  orders={orders}
                  setOrders={setOrders}
                  travelers={travelers}
                  setTravelers={setTravelers}
                  isDarkTheme={isDarkTheme}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  const { isAuthenticated, login, logout } = useAuth();

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage onLogin={login} isDarkTheme={true} />}
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AppContent isAuthenticated={isAuthenticated} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;