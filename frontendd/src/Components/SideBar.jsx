import { useState } from 'react';
import { Link } from 'react-router-dom';
import NexusLogo from '../assets/NexusLogo.png';
import { FaBell, FaCog, FaQuestionCircle, FaBars } from 'react-icons/fa';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-blue-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <FaBars />
      </button>

      <div
        className={`w-full lg:w-64 bg-gradient-to-br from-indigo-100 to-indigo-300 p-4 sm:p-6 flex flex-col fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:translate-x-0 lg:min-h-screen`}
      >
        <div className="flex items-center justify-center lg:justify-start mb-6 sm:mb-8">
          <Link to="/" onClick={() => setIsOpen(false)}>
            <img
              src={NexusLogo}
              alt="Nexus Logo"
              className="w-20 h-20 sm:w-24 sm:h-24 cursor-pointer"
            />
          </Link>
        </div>
        <nav className="flex-1 flex flex-col items-center lg:items-start space-y-6 sm:space-y-10">
          <Link
            to="/notifications"
            className="flex items-center text-sm sm:text-base font-semibold text-gray-700 hover:text-blue-600"
            onClick={() => setIsOpen(false)}
          >
            <FaBell className="mr-3 text-lg" />
            Notifications
          </Link>
          <Link
            to="/settings"
            className="flex items-center text-sm sm:text-base font-semibold text-gray-700 hover:text-blue-600"
            onClick={() => setIsOpen(false)}
          >
            <FaCog className="mr-3 text-lg" />
            Settings
          </Link>
          <Link
            to="/help"
            className="flex items-center text-sm sm:text-base font-semibold text-gray-700 hover:text-blue-600"
            onClick={() => setIsOpen(false)}
          >
            <FaQuestionCircle className="mr-3 text-lg" />
            Help/Support
          </Link>
        </nav>
      </div>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;