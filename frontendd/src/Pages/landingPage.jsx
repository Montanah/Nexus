import { useNavigate } from 'react-router-dom';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import OrderImage from '../assets/orderImage.png';
import OrderReception from '../assets/orderReception.png';
import DeliveryImage from '../assets/deliveryImage.png';
import OrderMatching from '../assets/orderMatching.png';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-400 min-h-screen flex flex-col lg:flex-row">
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between p-2 sm:p-4">
        <Header />
      </div>
      {/* Left Column - Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 md:p-12 pt-20 lg:pt-12">
        <div className="max-w-xl w-full">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-9xl font-extrabold text-indigo-900 mb-4 sm:mb-6 drop-shadow-lg">
            NEXUS
            <span className="block text-lg sm:text-xl md:text-2xl lg:text-3xl text-purple-700 mt-1 sm:mt-2">
              Global Delivery Reimagined
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-6 sm:mb-8">
            Connect clients with travelers worldwide. Deliver anything, anywhere, anytime. 
            Our platform bridges the gap between those who need items delivered and those 
            who can make it happen, creating a seamless, global delivery ecosystem.
          </p>
          
          {/* Key Features List */}
          <div className="space-y-2 sm:space-y-4 mb-6 sm:mb-8">
            {[
              'Instant Global Matching',
              'Secure Transactions', 
              'Real-time Tracking', 
              'Verified Travelers'
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-2 sm:space-x-3">
                <span className="text-green-500 text-lg sm:text-xl md:text-2xl">✓</span>
                <span className="text-gray-700 text-sm sm:text-base md:text-lg">{feature}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="space-x-2 sm:space-x-4 flex flex-col sm:flex-row items-center">
            <button 
              onClick={handleLogin}
              className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-2 md:px-8 md:py-3 bg-indigo-600 text-white rounded-full hover:bg-slate-950 transition-all shadow-lg text-sm sm:text-base"
            >
              Login
            </button>
            <button 
              onClick={handleSignup}
              className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-2 md:px-8 md:py-3 bg-purple-600 text-white rounded-full hover:bg-slate-950 transition-all shadow-lg text-sm sm:text-base"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>

      {/* Right Column - Customer Journey Graphics */}
      <div className="w-full lg:w-1/2 relative">
        <div className="sticky top-0 h-screen flex items-center justify-center px-4 sm:px-8 md:px-16 lg:px-30">
          <div className="w-full space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-0">
            <div className="flex flex-col lg:flex-row items-center justify-start pr-0 lg:pr-4">
              <motion.img
                src={OrderImage}
                alt="Order Placing Process Image"
                className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-35 lg:h-35 mb-2 lg:mb-0 lg:mr-0"
                initial={{ opacity: 0, x: -100 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1 }}
              />
              <p className="text-sm sm:text-base md:text-lg font-serif text-purple-700 italic text-center lg:text-left">
                Create product listing, specify delivery details & pay for the product
              </p>
            </div>
            <div className="flex flex-col lg:flex-row-reverse items-center justify-start">
              <motion.img
                src={OrderMatching}
                alt="Order Matching Process Image"
                className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-35 lg:h-35 mb-2 lg:mb-0 lg:ml-0"
                initial={{ opacity: 0, x: 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1 }}
              />
              <p className="text-sm sm:text-base md:text-lg font-serif text-indigo-900 italic text-center lg:text-right">
                Our smart algorithm matches your order with nearby travelers
              </p>
            </div>
            <div className="flex flex-col lg:flex-row items-center justify-start">
              <motion.img
                src={DeliveryImage}
                alt="Order Delivery Process Image"
                className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 mb-2 lg:mb-0 lg:mr-0"
                initial={{ opacity: 0, x: -100 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1 }}
              />
              <p className="text-sm sm:text-base md:text-lg font-serif text-purple-700 italic text-center lg:text-left">
                Traveler purchases the product and proceeds to make delivery
              </p>
            </div>
            <div className="flex flex-col lg:flex-row-reverse items-center justify-start">
              <motion.img
                src={OrderReception}
                alt="Order Reception Process Image"
                className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-35 lg:h-35 mb-2 lg:mb-0 lg:ml-0"
                initial={{ opacity: 0, x: 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1 }}
              />
              <p className="text-sm sm:text-base md:text-lg font-serif text-indigo-900 italic text-center lg:text-right">
                Client receives product, verified by both parties
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-15 p-2 sm:p-4 z-20 w-full lg:w-auto">
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;