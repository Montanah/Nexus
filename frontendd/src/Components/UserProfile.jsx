import { useState, useEffect } from 'react';
import axios from 'axios';

const UserProfile = ({ userId }) => {
  const [user, setUser] = useState({
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
        const response = await axios.get(`/api/user/${userId}`);
        const { name, email, avatar } = response.data;

        setUser({
          name: name || 'Unknown User',
          email: email || 'No email provided',
          avatar: avatar || 'https://maxm-imggenurl.web.val.run/user-avatar-placeholder',
        });
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <div className="fixed bottom-0 left-0 p-4 bg-gray-200 shadow-md w-64">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed bottom-0 left-0 p-4 bg-gray-200 shadow-md w-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 p-4 bg-gradient-to-br from-indigo-100 to-indigo-300 shadow-md w-64">
      <div className="flex items-center">
        <img
          src={user.avatar}
          alt="User Avatar"
          className="w-12 h-12 rounded-full mr-4"
        />
        <div>
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;