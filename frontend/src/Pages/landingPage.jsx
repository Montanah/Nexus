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

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-400 h-screen flex flex-col">
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between p-2 sm:p-4">
        <Header />
      </div>

      {/* Main Content Wrapper - Takes Remaining Space */}
      <div className="flex-grow flex flex-col lg:flex-row pt-20 lg:pt-24 overflow-y-auto">
        {/* Left Column - Content */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 md:p-12">
          <div className="max-w-xl w-full">
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-rose-500 to-purple-700 mb-4 sm:mb-6 drop-shadow-lg">
              NEXUS
              <span className="block text-lg sm:text-xl md:text-2xl lg:text-3xl text-purple-700 mt-1 sm:mt-2">
                Global Delivery <span className="text-red-500 font-bold"> Reimagined </span>
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-6 sm:mb-8">
              Connect clients with travelers worldwide. Deliver anything, anywhere, anytime. 
              Our platform bridges the gap between those who need items delivered and those 
              who can make it happen, creating a seamless, global delivery ecosystem.
            </p>

            {/* Key Features List */}
            <div className="space-y-2 sm:space-y-4 mb-6 sm:mb-8">
              {['Instant Global Matching', 'Secure Transactions', 'Real-time Tracking', 'Verified Travelers'].map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 sm:space-x-3">
                  <span className="text-green-500 text-lg sm:text-xl md:text-2xl">✓</span>
                  <span className="text-gray-700 text-sm sm:text-base md:text-lg">{feature}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-x-2 sm:space-x-4 flex flex-col sm:flex-row items-center w-full">
              <button 
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-6 py-3 md:px-8 md:py-3 bg-indigo-600 text-white rounded-full hover:bg-slate-950 transition-all shadow-lg text-base md:text-lg mb-3 sm:mb-0"
              >
                Login
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="w-full sm:w-auto px-6 py-3 md:px-8 md:py-3 bg-purple-600 text-white rounded-full hover:bg-slate-950 transition-all shadow-lg text-base md:text-lg"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Customer Journey Graphics */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8 md:px-16 lg:px-30">
          <div className="w-full space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-0">
            {[
              { img: OrderImage, text: "Create product listing, specify delivery details & pay for the product" },
              { img: OrderMatching, text: "Our smart algorithm matches your order with nearby travelers" },
              { img: DeliveryImage, text: "Traveler purchases the product and proceeds to make delivery" },
              { img: OrderReception, text: "Client receives product, verified by both parties" },
            ].map((item, index) => (
              <div key={index} className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center justify-start`}>
                <motion.img
                  src={item.img}
                  alt="Order Process"
                  className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-35 lg:h-35 mb-2 lg:mb-0 lg:mr-0"
                  initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1 }}
                />
                <p className={`text-sm sm:text-base md:text-lg font-serif ${index % 2 === 0 ? 'text-purple-700 lg:text-left' : 'text-indigo-900 lg:text-right'} italic text-center`}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer - Appears within the Screen */}
      <div className="w-full flex justify-center sm:justify-center md:justify-center lg:justify-start items-center p-4 sm:p-6">
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;
