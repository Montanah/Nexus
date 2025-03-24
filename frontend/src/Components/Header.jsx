import { useNavigate } from 'react-router-dom';
import Logo from '../assets/NexusLogo.png';

const Header = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between">
      <img
        src={Logo}
        alt="Nexus Logo"
        className="w-12 h-12 ml-2 sm:w-16 sm:h-16 sm:ml-4 md:w-20 md:h-20 md:ml-6 lg:w-24 lg:h-24 lg:ml-10 cursor-pointer"
        onClick={() => navigate('/')}
      />
    </div>
  );
};

export default Header;