import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import LandingPage from './Pages/landingPage/';
import SignUp from './Pages/signUp/';
import Login from './Pages/login/';
import ClientDashboard from './pages/ClientDashboard/';
import CartPage from './Pages/cartPage';
import Checkout from './Pages/checkout';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/client-dashboard" element={<ClientDashboard />} /> 
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} /> 
          <Route path="/checkout-success" element={<div>Checkout Successful!</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;