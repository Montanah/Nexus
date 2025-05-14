import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { fetchUser } from '../Services/api';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserProfile = ({ userId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'johndoe@example.com',
    avatar: 'https://maxm-imggenurl.web.val.run/user-avatar-placeholder',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        setError('No user ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // console.log("I reached here user:", user);
        if (user && user.name && user.email) {
          setProfile({
            name: user.name,
            email: user.email,
            avatar: user.avatar || 'https://maxm-imggenurl.web.val.run/user-avatar-placeholder',
          });
        } else {
          // Fetch user data
          const userData = await fetchUser(userId);
        
          // console.log('userData:', JSON.stringify(userData, null, 2));
          setProfile({
            name: userData?.data?.user?.name || 'Unknown User',
            email: userData?.data?.user?.email || 'No email provided',
            avatar: userData?.data?.user?.avatar || 'https://maxm-imggenurl.web.val.run/user-avatar-placeholder',
          });
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        if (err.response?.status === 401) {
          // Unauthorized: Log out and redirect to login
          await logout();
          navigate('/login');
        } else {
          setError(err.message || 'Failed to load user profile');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, user]);

  if (loading) {
    return (
      <div className="fixed bottom-0 left-0 w-full lg:w-64 p-4 bg-gray-200 shadow-md z-50">
        <p className="text-center text-sm sm:text-base">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed bottom-0 left-0 w-full lg:w-64 p-4 bg-gray-200 shadow-md z-50">
        <p className="text-red-500 text-center text-sm sm:text-base">{error}</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 w-full lg:w-64 p-4 sm:p-6 bg-gradient-to-br from-indigo-100 to-indigo-300 shadow-md z-50">
      <div className="flex items-center justify-center lg:justify-start">
        <img
          src={profile.avatar}
          alt="User Avatar"
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mr-3 sm:mr-4"
        />
        <div className="text-center lg:text-left">
          <p className="font-semibold text-sm sm:text-base">{profile.name}</p>
          <p className="text-xs sm:text-sm text-gray-500">{profile.email}</p>
        </div>
      </div>
    </div>
  );
};

UserProfile.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default UserProfile;