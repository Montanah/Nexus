import { useState } from 'react';
import { Link } from 'react-router-dom';
import NexusLogo from '../assets/NexusLogo.png';
import { FaBell, FaCog, FaQuestionCircle, FaBars, FaClipboardList } from 'react-icons/fa';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const navItems = [
    { to: '/client-dashboard', icon: FaClipboardList, label: 'Order Management' },
    { to: '/notifications', icon: FaBell, label: 'Notifications' },
    { to: '/settings', icon: FaCog, label: 'Settings' },
    { to: '/help', icon: FaQuestionCircle, label: 'Help/Support' },
  ];

  return (
    <>
      {/* Hamburger Menu Toggle for sm and md */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        <FaBars />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out bg-gradient-to-br from-indigo-100 to-indigo-300 p-4 sm:p-6 flex flex-col justify-between
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:w-64 lg:min-h-screen lg:sticky top-0
          ${isExpanded ? 'w-64' : 'md:w-50 lg:w-64'}`}
      >
        {/* Logo and Top Section */}
        <div className="flex flex-col items-center lg:items-start">
          <div className="flex items-center justify-center lg:justify-start mb-6 sm:mb-8">
            <Link to="/" onClick={() => { setIsOpen(false); setIsExpanded(false); }}>
              <img
                src={NexusLogo}
                alt="Nexus Logo"
                className="w-20 h-20 sm:w-24 sm:h-24 cursor-pointer"
              />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 flex flex-col items-center lg:items-start space-y-6 sm:space-y-10">
            {navItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center w-full text-gray-700 hover:text-blue-600 transition-colors text-sm sm:text-base font-semibold
                  ${(isOpen || isExpanded) ? 'justify-start' : 'justify-center lg:justify-start'}`}
                onClick={() => {
                  if (window.innerWidth < 1024) setIsOpen(false);
                  setIsExpanded(false);
                }}
                aria-label={label}
              >
                <Icon className="text-lg sm:text-xl" />
                {(isOpen || isExpanded || window.innerWidth >= 1024) && (
                  <span className="ml-3 truncate">{label}</span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Expand/Collapse Toggle for md */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="md:block lg:hidden mt-4 p-2 bg-blue-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 hidden"
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? '✖' : '☰'}
        </button>
      </div>

      {/* Overlay for sm */}
      {isOpen && (
        <div
          // className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;