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
import DashboardLanding from './components/DashboardLanding';
import UserDetails from './components/UserDetails';
import TravelerDetails from './components/TravelerDetails';
import { ResourceEmpty, ResourceNotice } from './components/ResourceState';
import {
  canRead,
  canVisit,
  pageTitles,
  resourceNames,
} from './components/overviewModel';

const MainRouter = ({
  admin,
  resources,
  onRetry,
  onNavigate,
  setRecords,
  isDarkTheme,
}) => {
  const users = resources.users.data || [],
    products = resources.products.data || [],
    orders = resources.orders.data || [],
    travelers = resources.travelers.data || [];
  const setUsers = (update) => setRecords('users', update),
    setProducts = (update) => setRecords('products', update),
    setOrders = (update) => setRecords('orders', update),
    setTravelers = (update) => setRecords('travelers', update);
  const page = (section, content, required = [], optional = []) => {
    if (!canVisit(admin, section))
      return (
        <ResourceEmpty
          resource={{ status: 'restricted' }}
          label={pageTitles[section]}
        />
      );
    const waiting = required.find((key) => resources[key].data === null);
    if (waiting)
      return (
        <ResourceEmpty
          resource={resources[waiting]}
          label={resourceNames[waiting]}
          onRetry={() => onRetry(waiting)}
        />
      );
    return (
      <>
        {[...required, ...optional.filter((key) => canRead(admin, key))].map(
          (key) => (
            <ResourceNotice
              key={key}
              resource={resources[key]}
              label={resourceNames[key]}
              onRetry={() => onRetry(key)}
            />
          ),
        )}
        {content}
      </>
    );
  };
  return (
    <Routes>
      <Route
        path="/"
        element={
          <DashboardLanding
            admin={admin}
            resources={resources}
            onRetry={onRetry}
            onNavigate={onNavigate}
          />
        }
      />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route
        path="/users"
        element={page(
          'users',
          <UsersComponent
            users={users}
            setUsers={setUsers}
            isDarkTheme={isDarkTheme}
          />,
          ['users'],
        )}
      />
      <Route
        path="/products"
        element={page(
          'products',
          <ProductsComponent
            products={products}
            setProducts={setProducts}
            isDarkTheme={isDarkTheme}
          />,
          ['products'],
        )}
      />
      <Route
        path="/orders"
        element={page(
          'orders',
          <OrdersComponent
            orders={orders}
            setOrders={setOrders}
            users={users}
            travelers={travelers}
            products={products}
            isDarkTheme={isDarkTheme}
          />,
          ['orders'],
          ['users', 'travelers', 'products'],
        )}
      />
      <Route
        path="/analytics"
        element={page(
          'analytics',
          <AnalyticsComponent onNavigate={onNavigate} />,
        )}
      />
      <Route
        path="/travelers"
        element={page(
          'travelers',
          <TravelersComponent
            travelers={travelers}
            setTravelers={setTravelers}
            users={users}
            isDarkTheme={isDarkTheme}
          />,
          ['travelers'],
          ['users'],
        )}
      />
      <Route
        path="/transactions"
        element={page(
          'transactions',
          <PaymentComponent
            orders={orders}
            setOrders={setOrders}
            users={users}
            isDarkTheme={isDarkTheme}
          />,
          canRead(admin, 'orders') ? ['orders'] : [],
          ['users'],
        )}
      />
      <Route
        path="/admins"
        element={page(
          'admins',
          <AdminManagementComponent isDarkTheme={isDarkTheme} />,
        )}
      />
      <Route
        path="/payments"
        element={page(
          'payments',
          <PaymentManagementComponent isDarkTheme={isDarkTheme} />,
        )}
      />
      <Route
        path="/profile"
        element={<ProfileComponent isDarkTheme={isDarkTheme} />}
      />
      <Route
        path="/edit-profile"
        element={<EditProfileComponent isDarkTheme={isDarkTheme} />}
      />
      <Route
        path="/users/:userId"
        element={page(
          'users',
          <UserDetails
            users={users}
            setUsers={setUsers}
            isDarkTheme={isDarkTheme}
          />,
          ['users'],
        )}
      />
      <Route
        path="/travelers/:travelerId"
        element={page(
          'travelers',
          <TravelerDetails isDarkTheme={isDarkTheme} />,
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
export default MainRouter;
