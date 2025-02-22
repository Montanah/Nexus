import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/NexusLogo.png';
import OrderImage from '../assets/orderImage.png';
import OrderReception from '../assets/orderReception.png';
import DeliveryImage from '../assets/deliveryImage.png';
import OrderMatching from '../assets/orderMatching.png';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const { setCurrentRoute } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    setCurrentRoute('login');

    // Navigate to login page;
    navigate('/login');
  };

  const handleSignup = () => {
    setCurrentRoute('signup');

    // Navigate to signup page;
    navigate('/signup');
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-400 min-h-screen flex">
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        <img src={Logo} alt="Nexus Logo" className="w-25 h-25 ml-10" />
      </div>
      {/* Left Column - Content */}
      <div className="w-1/2 flex items-center justify-center p-12">
        <div className="max-w-xl">
          <h1 className="text-9xl font-extrabold text-indigo-900 mb-6 drop-shadow-lg">
            NEXUS 
            <span className="block text-3xl text-purple-700 mt-2">
              Global Delivery Reimagined
            </span>
          </h1>
          <p className="text-lg text-gray-700 mb-8">
            Connect clients with travelers worldwide. Deliver anything, anywhere, anytime. 
            Our platform bridges the gap between those who need items delivered and those 
            who can make it happen, creating a seamless, global delivery ecosystem.
          </p>
          
          {/* Key Features List */}
          <div className="space-y-4 mb-8">
            {[
              'Instant Global Matching',
              'Secure Transactions', 
              'Real-time Tracking', 
              'Verified Travelers'
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <span className="text-green-500 text-2xl">✓</span>
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="space-x-4">
            <button 
              onClick={handleLogin}
              className="px-8 py-3 bg-indigo-600 text-white rounded-full hover:bg-slate-950 transition-all shadow-lg"
            >
              Login
            </button>
            <button 
              onClick={handleSignup}
              className="px-8 py-3 bg-purple-600 text-white rounded-full hover:bg-slate-950 transition-all shadow-lg"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>

      {/* Right Column - Customer Journey Graphics */}
      <div className="w-1/2 relative">
        <div className="sticky top-0 h-screen flex items-center justify-center px-30">
          <div className="w-full space-y-0 px-0"> {/* Added space-y-6 for consistent vertical spacing */}
            {/* Item 1: Image on the left, text on the right */}
            <div className="flex items-center justify-start pr-4">
              <motion.img
                src={OrderImage}
                alt="Order Placing Process Image"
                className="w-35 h-35 mr-0"
                initial={{ opacity: 0, x: -100 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1 }}
              />
              <p className="text-lg font-serif text-purple-700 italic">
                Create product listing, specify delivery details & pay for the product
              </p>
            </div>

            {/* Item 2: Image on the right, text on the left */}
            <div className="flex items-center justify-end">
              <p className="text-lg font-serif text-indigo-900 italic">
                Our smart algorithm matches your order with nearby travelers
              </p>
              <motion.img
                src={OrderMatching}
                alt="Order Matching Process Image"
                className="w-35 h-35 ml-0"
                initial={{ opacity: 0, x: 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1 }}
              />
            </div>

            {/* Item 3: Image on the left, text on the right */}
            <div className="flex items-center justify-start">
              <motion.img
                src={DeliveryImage}
                alt="Order Delivery Process Image"
                className="w-40 h-40 mr-0"
                initial={{ opacity: 0, x: -100 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1 }}
              />
              <p className="text-lg font-serif text-purple-700 italic">
                Traveler purchases the product and proceeds to make delivery
              </p>
            </div>

            {/* Item 4: Image on the right, text on the left */}
            <div className="flex items-center justify-end">
              <p className="text-lg font-serif text-indigo-900 italic">
                Client receives product, verified by both parties
              </p>
              <motion.img
                src={OrderReception}
                alt="Order Reception Process Image"
                className="w-35 h-35 ml-0"
                initial={{ opacity: 0, x: 100 }}
                whileInView={{ opacity: 1, x: 0 }} /* Changed x to y for vertical animation */
                transition={{ duration: 1 }}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="absolute bottom-2 left-18 text-center text-gray-500 text-sm">
            <p>Copyright &copy; 2025 Nexus. All rights reserved.</p>
        </footer>
    </div>

  );
};

export default LandingPage;