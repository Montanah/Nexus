import { useNavigate } from 'react-router-dom';
import Logo from '../assets/NexusLogo.png';

const Header = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between">
      <img
        src={Logo}
        alt="Nexus Logo"
        className="w-25 h-25 ml-10 cursor-pointer"
        onClick={() => navigate('/')}
      />
    </div>
  );
};

export default Header;