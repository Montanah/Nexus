import React from 'react';
import { useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import { JOURNEY_STEPS } from '../Constants/journeySteps';
import { generateDynamicImage } from '../utils/imageGenerator';

const LandingPage = () => {
  const { setCurrentRoute } = useAuth();
  const [activeStep, setActiveStep] = useState(0);

  const journeyImages = JOURNEY_STEPS.map((step) =>
    generateDynamicImage(`4K ultra-detailed illustration of ${step.title} in logistics delivery process`)
  );

  const handleLogin = () => {
    setCurrentRoute('login');
  };

  const handleSignup = () => {
    setCurrentRoute('signup');
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-100 min-h-screen flex">
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
              className="px-8 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all shadow-lg"
            >
              Login
            </button>
            <button 
              onClick={handleSignup}
              className="px-8 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-all shadow-lg"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>

      {/* Right Column - Journey Graphics */}
      <div className="w-1/2 relative">
        <div className="sticky top-0 h-screen flex items-center justify-center p-8">
          <div className="w-full h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
            <img 
              src={journeyImages[activeStep]} 
              alt={JOURNEY_STEPS[activeStep].title}
              className="w-full h-full object-cover transition-all duration-500 ease-in-out"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
              <h2 className="text-2xl font-bold">{JOURNEY_STEPS[activeStep].title}</h2>
              <p>{JOURNEY_STEPS[activeStep].description}</p>
            </div>
          </div>
        </div>
        
        {/* Step Navigation */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {JOURNEY_STEPS.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveStep(index)}
              className={`w-3 h-3 rounded-full ${
                activeStep === index ? 'bg-indigo-600' : 'bg-gray-300 hover:bg-indigo-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;