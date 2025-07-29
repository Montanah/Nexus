import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import UsersComponent from './components/UsersComponent';
import ProductsComponent from './components/ProductsComponent';
import OrdersComponent from './components/OrdersComponent';
import AnalyticsComponent from './components/AnalyticsComponent';
import TravelersComponent from './components/TravelersComponent';
import PaymentComponent from './components/PaymentComponent';
import AdminManagementComponent from './components/AdminManagementComponent';
import PaymentManagementComponent from './components/PaymentManagementComponent';
import ProfileComponent from './components/ProfileComponent';
import EditProfileComponent from './components/EditProfileComponent';
import LoginPage from './pages/LoginPage';
import DashboardLanding from './components/DashboardLanding';
import UserDetails from './components/UserDetails';
import TravelerDetails from './components/TravelerDetails';

const MainRouter = ({ users, setUsers, products, setProducts, orders, setOrders, travelers, setTravelers, isDarkTheme }) => {
  return (
    <Routes>
      <Route path="/" element={<DashboardLanding users={users} products={products} orders={orders} travelers={travelers} isDarkTheme={isDarkTheme} /> } />
      {/* <Route path="/" element={<Navigate to="/users" />} /> */}
      <Route path="/users" element={<UsersComponent users={users} setUsers={setUsers} isDarkTheme={isDarkTheme} />} />
      <Route path="/products" element={<ProductsComponent products={products} setProducts={setProducts} isDarkTheme={isDarkTheme} />} />
      <Route path="/orders" element={<OrdersComponent orders={orders} setOrders={setOrders} users={users} travelers={travelers} products={products} isDarkTheme={isDarkTheme} />} />
      <Route path="/analytics" element={<AnalyticsComponent isDarkTheme={isDarkTheme} />} />
      <Route path="/travelers" element={<TravelersComponent travelers={travelers} setTravelers={setTravelers} users={users} isDarkTheme={isDarkTheme} />} />
      <Route path="/transactions" element={<PaymentComponent orders={orders} setOrders={setOrders} users={users} isDarkTheme={isDarkTheme} />} />
      <Route path="/admins" element={<AdminManagementComponent isDarkTheme={isDarkTheme} />} />
      <Route path="/payments" element={<PaymentManagementComponent isDarkTheme={isDarkTheme} />} />
      <Route path="/profile" element={<ProfileComponent isDarkTheme={isDarkTheme} />} />
      <Route path="/edit-profile" element={<EditProfileComponent isDarkTheme={isDarkTheme} />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/users/:userId" element={<UserDetails users={users} setUsers={setUsers} isDarkTheme={isDarkTheme} />} />
      <Route path="/travelers/:travelerId" element={<TravelerDetails isDarkTheme={isDarkTheme} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default MainRouter;
