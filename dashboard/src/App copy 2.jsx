import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

import Sidebar from './components/Sidebar';
import { Menu } from 'lucide-react';
import LoginPage from './pages/LoginPage';
import MainRouter from './MainRouter';
import ProtectedRoute from './components/ProtectedRoute';

import { fetchUsers, fetchProducts, fetchOrders, fetchTravelers } from './api';

const AppContent = ({ isAuthenticated }) => {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [travelers, setTravelers] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { admin, logout } = useAuth(); // Get logout from context

  const toggleTheme = () => setIsDarkTheme(!isDarkTheme);

  const location = useLocation();
  const activeTab = location.pathname.slice(1) || 'users';
  

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
          logout(); // Use context logout
          window.location.href = '/login';
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, logout]);

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
                <h1 className="text-2xl font-bold capitalize">{activeTab}</h1>
              </div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">{admin?.name || 'AD'}</span>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
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