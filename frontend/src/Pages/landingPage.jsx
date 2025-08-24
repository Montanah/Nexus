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
    <div className="bg-gradient-to-br from-indigo-50 to-purple-400 min-h-screen flex flex-col">
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between p-2 sm:p-2">
        <Header />
      </div>

      {/* Main Content */}
      <div className="flex-grow flex flex-col lg:flex-row pt-10 lg:pt-10 ">
        {/* Left Column - Content */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-12 md:p-12">
          <motion.div 
            className="max-w-md w-full space-y-6 sm:space-y-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Headline */}
            <div>
              <motion.h1 
                className="ext-5xl sm:text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-rose-500 to-purple-700 leading-tight"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                NEXUS
              </motion.h1>
              <motion.p 
                className="text-xl sm:text-2xl md:text-3xl text-purple-700 mt-2 font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                Global Delivery <span className="text-red-500">Reimagined</span>
              </motion.p>
            </div>

            {/* Value Proposition */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                Ship with Travelers, Not Couriers
              </h2>
              <p className="text-gray-700  text-sm sm:text-base leading-relaxed">
                Connect with our global network of verified travelers to deliver anything, anywhere — faster and more affordably than traditional shipping.
              </p>
            </motion.div>

            {/* Key Features */}
            <motion.div 
              className="space-y-3 sm:space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              {[
                'Instant matching with travelers on your route',
                'Escrow protection for secure payments',
                'Real-time package tracking',
                'Verified travelers only'
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  className="flex items-start space-x-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                >
                  <span className="text-green-500 text-xl mt-0.5">✓</span>
                  <span className="text-gray-700 text-sm sm:text-base">{feature}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Closing Statement */}
            <motion.p 
              className="text-gray-700 italic text-sm sm:text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              No middlemen. No overpaying. Just simple, secure peer-to-peer delivery.
            </motion.p>

            {/* Action Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-3 pt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.6 }}
            >
              <button 
                onClick={() => navigate('/login')}
                className="px-6 py-3 bg-indigo-600 text-white bg-indigo-600 rounded-full hover:bg-slate-950 transition-all shadow-lg text-base font-medium"
              >
                Login
              </button>
             <button 
                onClick={() => navigate('/signup')}
                className="px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 hover:bg-slate-950 hover:border-transparent hover:text-white rounded-full transition-all shadow-lg text-base font-medium"
              >
                Sign Up
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Column - Customer Journey Graphics */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8 md:px-16 lg:px-20 py-2">
          <div className="w-full max-w-lg space-y-6 sm:space-y-8 md:space-y-10">
            {[
              { img: OrderImage, text: "Create product listing, specify delivery details & pay for the product" },
              { img: OrderMatching, text: "Our smart algorithm matches your order with nearby travelers" },
              { img: DeliveryImage, text: "Traveler purchases the product and proceeds to make delivery" },
              { img: OrderReception, text: "Client receives product, verified by both parties" },
            ].map((item, index) => (
              <motion.div
                key={index}
                className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-4`}
                initial={{ opacity: 0, x: index % 2 === 0 ? 100 : -100 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.15 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <motion.img
                  src={item.img}
                  alt="Order Process"
                  className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                />
                <p className={`text-sm sm:text-base md:text-lg ${index % 2 === 0 ? 'text-purple-700 lg:text-left' : 'text-indigo-900 lg:text-right'} italic text-center font-serif`}>
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full flex justify-center sm:p-2">
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;