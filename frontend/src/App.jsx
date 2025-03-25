import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import LandingPage from './Pages/landingPage/';
import SignUp from './Pages/signUp/';
import Login from './Pages/login/';
import ClientDashboard from './Pages/ClientDashboard/';
import NewOrder from './Pages/newOrder';
import CartPage from './Pages/cartPage';
import Checkout from './Pages/checkout';
import ForgotPassword from './Pages/forgotPassword';
import ResetPassword from './Pages/resetPassword';
import EmailSentConfirmation from './Pages/emailSentConfirmation';  
import PaymentSuccess from './Pages/paymentSuccess';
import TravelerDashboard from './Pages/travelerDashboard';
import Settings from './Pages/settings';
import RatingForm from './Pages/ratingsForm';
import ProductDetails from './Pages/productDetails';
// import Help from './Pages/help';
// import Notifications from './Pages/notifications';

const RatingFormWithLocation = () => {
  const location = useLocation();
  return <RatingForm isTraveler={location.state?.isTraveler} />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
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
          <Route path="/traveler-dashboard" element={<TravelerDashboard />} />
          <Route path="/product-details/:productId" element={<ProductDetails />} />
          <Route path="/rate-product/:productId" element={<RatingFormWithLocation />} />
          <Route path="/settings" element={<Settings />} />
          {/* <Route path="/help" element={<Help />} />
          <Route path="/notifications" element={<Notifications/>} /> */}
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;