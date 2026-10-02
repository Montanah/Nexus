import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import LandingPage from './Pages/landingPage/';
import SignUp from './Pages/signUp/';
import Login from './Pages/login/';
import ClientDashboard from './Pages/clientDashboard/';
import NewOrder from './Pages/newOrder';
import CartPage from './Pages/cartPage';
import Checkout from './Pages/checkout';
import ForgotPassword from './Pages/forgotPassword';
import ResetPassword from './Pages/resetPassword';
import EmailSentConfirmation from './Pages/emailSentConfirmation';  
import PaymentSuccess from './Pages/paymentSuccess';
import PaymentFailure from './Pages/paymentFailure';
import TravelerDashboard from './Pages/travelerDashboard';
import Settings from './Pages/settings';
import RatingForm from './Pages/ratingsForm';
import ProductDetails from './Pages/productDetails';
import PaystackVerify from './Components/PaystackVerify';
// import Help from './Pages/help';
// import Notifications from './Pages/notifications';

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

const RatingFormWithLocation = () => {
  const location = useLocation();
  return <RatingForm isTraveler={location.state?.isTraveler} />;
};

const ApplicationRoutes = () => {
  return (
    <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/email-sent" element={<EmailSentConfirmation />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/client-dashboard" element={<ClientDashboard />} />
          <Route path="/new-order" element={<NewOrder />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-failure" element={<PaymentFailure />} />
          <Route path="/traveler-dashboard" element={<TravelerDashboard />} />
          <Route path="/product-details/:productId" element={<ProductDetails />} />
          <Route path="/rate-product/:productId" element={<RatingFormWithLocation />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/verify-paystack" element={<PaystackVerify />} />
          {/* <Route path="/help" element={<Help />} />
          <Route path="/notifications" element={<Notifications/>} /> */}
        </Routes>
    </AuthProvider>
  );
};

const App = () => (
  <Router>
    <Routes>
      {import.meta.env.DEV && <Route path="/preview/client-dashboard" element={<Suspense fallback={<p role="status">Loading dashboard preview…</p>}><ClientDashboardPreview /></Suspense>} />}
      {import.meta.env.DEV && <Route path="/preview/traveler-dashboard" element={<Suspense fallback={<p role="status">Loading dashboard preview…</p>}><TravelerDashboardPreview /></Suspense>} />}
      {import.meta.env.DEV && <Route path="/preview/new-order" element={<Suspense fallback={<p role="status">Loading order preview…</p>}><NewOrderPreview /></Suspense>} />}
      <Route path="/*" element={<ApplicationRoutes />} />
    </Routes>
  </Router>
);

export default App;
