// components/EditProfileComponent.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { fetchAdminProfile, updateAdminProfile } from '../api';
import { User, Mail, Lock, Save } from 'lucide-react';

const EditProfileComponent = ({ isDarkTheme }) => {
  const { admin, setLoading } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    password: '', // Optional; only sent if changed
    role: '',
    permissions: [],
  });
  const [isLoading, setIsLoadingLocal] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoadingLocal(true);
      setError('');
      try {
        setLoading(true);
        const data = await fetchAdminProfile();
        setProfile({
          name: data.name || '',
          email: data.email || '',
          password: '', // Don't prefill password
          role: data.role || '',
          permissions: data.permissions || [],
        });
      } catch (err) {
        setError('Failed to load profile. Please try again.');
        console.error('Profile fetch error:', err);
      } finally {
        setIsLoadingLocal(false);
        setLoading(false);
      }
    };

    if (!admin) loadProfile();
  }, [admin, setLoading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (e) => {
    const { value, checked } = e.target;
    setProfile((prev) => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, value]
        : prev.permissions.filter((perm) => perm !== value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoadingLocal(true);
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      const updateData = { name: profile.name, email: profile.email };
      if (profile.password) updateData.password = profile.password; // Only send if provided
      const updatedProfile = await updateAdminProfile(updateData);
      setProfile((prev) => ({ ...prev, ...updatedProfile, password: '' }));
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Profile update error:', err);
    } finally {
      setIsLoadingLocal(false);
      setLoading(false);
    }
  };

  return (
    <div className={`p-6 ${isDarkTheme ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
      <h2 className={`text-2xl font-bold mb-6 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Edit Profile</h2>
      {error && <div className={`p-4 mb-4 text-red-500 ${isDarkTheme ? 'bg-gray-700' : 'bg-red-100'}`}>{error}</div>}
      {success && <div className={`p-4 mb-4 text-green-500 ${isDarkTheme ? 'bg-gray-700' : 'bg-green-100'}`}>{success}</div>}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={`bg-white rounded-2xl shadow-lg p-6 ${isDarkTheme ? 'bg-gray-700 border-gray-600' : 'border-gray-100'}`}>
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            <div>
              <h3 className={`text-xl font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                {profile.name || 'Admin User'}
              </h3>
              <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                {profile.role || 'Admin'}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className={`block mb-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>Name</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${isDarkTheme ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-100 border-gray-300'}`}
                required
              />
            </div>
            <div>
              <label className={`block mb-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${isDarkTheme ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-100 border-gray-300'}`}
                required
              />
            </div>
            <div>
              <label className={`block mb-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>Password (leave blank to keep unchanged)</label>
              <input
                type="password"
                name="password"
                value={profile.password}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${isDarkTheme ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-100 border-gray-300'}`}
              />
            </div>
            <div>
              <label className={`block mb-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>Permissions</label>
              {['view_users', 'edit_users', 'view_orders', 'edit_orders'].map((perm) => (
                <div key={perm} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    value={perm}
                    checked={profile.permissions.includes(perm)}
                    onChange={handlePermissionChange}
                    className="mr-2"
                  />
                  <span className={isDarkTheme ? 'text-gray-200' : 'text-gray-700'}>{perm}</span>
                </div>
              ))}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex items-center px-4 py-2 rounded ${isDarkTheme ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Save className="w-5 h-5 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EditProfileComponent;