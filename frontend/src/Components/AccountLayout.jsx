import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../Context/AuthContext';

const AccountLayout = () => <AuthProvider><Outlet /></AuthProvider>;
export default AccountLayout;
