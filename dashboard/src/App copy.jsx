import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import UsersComponent from './components/UsersComponent';
import ProductsComponent from './components/ProductsComponent';
import OrdersComponent from './components/OrdersComponent';
import AnalyticsComponent from './components/AnalyticsComponent';
import TravelersComponent from './components/TravelersComponent';
import UserDetails from './components/UserDetails';
import PaymentComponent from './components/PaymentComponent';

const App = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [travelers, setTravelers] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true); // Default to dark theme

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  useEffect(() => {
    axios.get('/api/admin/users')
      .then(res => {
        const usersData = res.data?.data?.users;
        setUsers(Array.isArray(usersData) ? usersData : []);
      })
      .catch(() => setUsers([]));

    axios.get('/api/admin/products')
      .then(res => {
        const productsData = res.data?.data?.products;
        setProducts(Array.isArray(productsData) ? productsData : []);
      })
      .catch(() => setProducts([]));

    axios.get('/api/admin/orders')
      .then(res => {
        const ordersData = res.data?.data?.orders; 
        console.log(ordersData);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      })
      .catch(() => setOrders([]));

     axios.get('/api/admin/travelers') 
      .then(res => {
        const travelersData = res.data?.data?.travelers || res.data?.data; 
        setTravelers(Array.isArray(travelersData) ? travelersData : []);
      })
      .catch(() => setTravelers([]));
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UsersComponent users={users} setUsers={setUsers} isDarkTheme={isDarkTheme} />;
      case 'products':
        return <ProductsComponent products={products} setProducts={setProducts} isDarkTheme={isDarkTheme} />;
      case 'orders':
        return <OrdersComponent orders={orders} setOrders={setOrders} users={users} isDarkTheme={isDarkTheme} />;
      case 'analytics':
        return <AnalyticsComponent isDarkTheme={isDarkTheme} />;
      case 'travelers': 
        return <TravelersComponent travelers={travelers} setTravelers={setTravelers} users={users} isDarkTheme={isDarkTheme} />;
      case 'payment':
        return <PaymentComponent orders={orders} setOrders={setOrders} users={users} isDarkTheme={isDarkTheme}/>;
      default:
        return <UsersComponent users={users} setUsers={setUsers} isDarkTheme={isDarkTheme}/>;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar 
        setActiveTab={setActiveTab} 
        activeTab={activeTab} 
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
        {/* Header */}
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
                <h1 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'} capitalize`}>
                  {activeTab}
                </h1>
                <p className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  {activeTab === 'users' && 'Manage platform users'}
                  {activeTab === 'products' && 'Manage product catalog'}
                  {activeTab === 'orders' && 'Track delivery orders'}
                  {activeTab === 'travelers' && 'Manage platform travelers'}
                  {activeTab === 'analytics' && 'View platform analytics'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className={`text-sm font-medium ${isDarkTheme ? 'text-gray-200' : 'text-gray-900'}`}>Welcome back!</p>
                <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Last login: Today</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">AD</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
       <main className="p-0 lg:p-0 w-full">
      <div className="w-full mx-auto max-w-screen-xl">
        {renderContent()}
      </div>
    </main>
      </div>
    </div>
  );
};

export default App;