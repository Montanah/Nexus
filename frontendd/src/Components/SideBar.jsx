import { Link } from 'react-router-dom';
import NexusLogo from '../assets/NexusLogo.png';
import { FaBell, FaCog, FaQuestionCircle } from 'react-icons/fa';

const Sidebar = () => (
  <div className="w-64 bg-gradient-to-br from-indigo-100 to-indigo-300 p-4 flex flex-col">
    <div className="flex items-center mb-8">
      <Link to="/">
        <img
          src={NexusLogo}
          alt="Nexus Logo"
          className="w-25 h-25 ml-10 cursor-pointer"
        />
      </Link>
    </div>
    <nav className="flex-1 items-center space-y-10">
      <Link
        to="/notifications"
        className="flex items-center text-m font-semibold text-gray-700 hover:text-blue-600"
      >
        <FaBell className="mr-3" />
        Notifications
      </Link>
      <Link
        to="/settings"
        className="flex items-center text-m font-semibold text-gray-700 hover:text-blue-600"
      >
        <FaCog className="mr-3" />
        Settings
      </Link>
      <Link
        to="/help"
        className="flex items-center text-m font-semibold text-gray-700 hover:text-blue-600"
      >
        <FaQuestionCircle className="mr-3" />
        Help/Support
      </Link>
    </nav>
  </div>
);

export default Sidebar;