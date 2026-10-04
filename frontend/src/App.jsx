import { lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PageBoundary from './Components/PageBoundary';
import LandingPage from './Pages/landingPage/';
const SignUp = lazy(() => import('./Pages/signUp'));
const Login = lazy(() => import('./Pages/login'));
const ClientDashboard = lazy(() => import('./Pages/clientDashboard'));
const NewOrder = lazy(() => import('./Pages/newOrder'));
const CartPage = lazy(() => import('./Pages/cartPage'));
const Checkout = lazy(() => import('./Pages/checkout'));
const ForgotPassword = lazy(() => import('./Pages/forgotPassword'));
const ResetPassword = lazy(() => import('./Pages/resetPassword'));
const EmailSentConfirmation = lazy(() => import('./Pages/emailSentConfirmation'));
const PaymentSuccess = lazy(() => import('./Pages/paymentSuccess'));
const PaymentFailure = lazy(() => import('./Pages/paymentFailure'));
const OrderDetails = lazy(() => import('./Pages/orderDetails'));
const TravelerDashboard = lazy(() => import('./Pages/travelerDashboard'));
const Settings = lazy(() => import('./Pages/settings'));
const RatingForm = lazy(() => import('./Pages/ratingsForm'));
const ProductDetails = lazy(() => import('./Pages/productDetails'));
const PaystackVerify = lazy(() => import('./Components/PaystackVerify'));
const NotFound = lazy(() => import('./Pages/notFound'));
const SessionGuard = lazy(() => import('./Components/SessionGuard'));

// Vite removes this import and the preview route from production builds.
const ClientDashboardPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/ClientDashboardPreview'))
  : null;
const TravelerDashboardPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/TravelerDashboardPreview'))
  : null;
const NewOrderPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/NewOrderPreview'))
  : null;
const CartPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/CartPreview'))
  : null;
const CheckoutPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/CheckoutPreview'))
  : null;
const PaymentResultPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/PaymentResultPreview'))
  : null;
const OrderDetailsPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/OrderDetailsPreview'))
  : null;

const RatingPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/RatingPreview'))
  : null;

const SettingsPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/SettingsPreview'))
  : null;

const PasswordRecoveryPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/PasswordRecoveryPreview'))
  : null;

const DeliveryDetailsPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/DeliveryDetailsPreview'))
  : null;

// Load account code only when entering an account route; keep context shared thereafter.
const AccountLayout = lazy(() => import('./Components/AccountLayout'));
const page = element => <PageBoundary>{element}</PageBoundary>;

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      {import.meta.env.DEV && <Route path="/preview/client-dashboard" element={page(<ClientDashboardPreview />)} />}
      {import.meta.env.DEV && <Route path="/preview/traveler-dashboard" element={page(<TravelerDashboardPreview />)} />}
      {import.meta.env.DEV && <Route path="/preview/new-order" element={page(<NewOrderPreview />)} />}
      {import.meta.env.DEV && <Route path="/preview/cart" element={page(<CartPreview />)} />}
      {import.meta.env.DEV && <Route path="/preview/checkout" element={page(<CheckoutPreview />)} />}
      {import.meta.env.DEV && <Route path="/preview/payment-success" element={page(<PaymentResultPreview key="success" initialStatus="success" />)} />}
      {import.meta.env.DEV && <Route path="/preview/payment-failure" element={page(<PaymentResultPreview key="failed" initialStatus="failed" />)} />}
      {import.meta.env.DEV && <Route path="/preview/order-details" element={page(<OrderDetailsPreview />)} />}
      {import.meta.env.DEV && <Route path="/preview/rating" element={page(<RatingPreview />)} />}
      {import.meta.env.DEV && <Route path="/preview/settings" element={page(<SettingsPreview />)} />}
      {import.meta.env.DEV && <Route path="/preview/password-recovery" element={page(<PasswordRecoveryPreview />)} />}
      {import.meta.env.DEV && <Route path="/preview/delivery-details" element={page(<DeliveryDetailsPreview />)} />}
      {/* Public recovery pages must remain accessible without an auth/backend request. */}
      <Route path="/forgot-password" element={page(<ForgotPassword />)} />
      <Route path="/email-sent" element={page(<EmailSentConfirmation />)} />
      <Route path="/reset-password" element={page(<ResetPassword />)} />
      <Route element={page(<AccountLayout />)}>
          <Route path="/signup" element={page(<SignUp />)} />
          <Route path="/login" element={page(<Login />)} />
          <Route element={page(<SessionGuard />)}>
            <Route path="/client-dashboard" element={page(<ClientDashboard />)} />
            <Route path="/new-order" element={page(<NewOrder />)} />
            <Route path="/cart" element={page(<CartPage />)} />
            <Route path="/checkout" element={page(<Checkout />)} />
            <Route path="/payment-success" element={page(<PaymentSuccess />)} />
            <Route path="/payment-failure" element={page(<PaymentFailure />)} />
            <Route path="/orders/:orderNumber" element={page(<OrderDetails />)} />
            <Route path="/traveler-dashboard" element={page(<TravelerDashboard />)} />
            <Route path="/product-details/:productId" element={page(<ProductDetails />)} />
            <Route path="/rate-product/:productId" element={page(<RatingForm />)} />
            <Route path="/settings" element={page(<Settings />)} />
            <Route path="/verify-paystack" element={page(<PaystackVerify />)} />
          </Route>
      </Route>
      <Route path="*" element={page(<NotFound />)} />
    </Routes>
  </Router>
);

export default App;
