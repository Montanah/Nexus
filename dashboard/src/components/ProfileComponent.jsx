// components/ProfileComponent.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { fetchAdminProfile } from '../api';
import { User, Lock, Mail } from 'lucide-react';

const ProfileComponent = ({ isDarkTheme }) => {
    const { admin, setLoading } = useAuth();
    const [profile, setProfile] = useState(admin || {});
    const [isLoading, setIsLoadingLocal] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadProfile = async () => {
            setIsLoadingLocal(true);
            setError('');
            
            try {
                setLoading(true);
                const data = await fetchAdminProfile();
                setProfile(data || {}); // Default to empty object if no data
            } catch (err) {
                setError('Failed to load profile. Please try again. Check console for details.');
                console.error('Profile fetch error:', err.response?.data || err.message);
            } finally {
                setIsLoadingLocal(false);
                setLoading(false);
            }
        };

        // Temporarily force execution for debugging
        console.log(admin);
        console.log('Condition check - !admin || !admin.name:', !admin || !admin.name);
        if (!admin || !admin.name) {
            console.log('Condition met, calling loadProfile...');
            loadProfile();
        } else {
            console.log('Condition not met, using existing admin:', admin);
            setProfile(admin); // Use existing admin if available
            setIsLoadingLocal(false);
        }
    }, [admin, setLoading]);
    return (
        <div className={`p-6 ${isDarkTheme ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <h2 className={`text-2xl font-bold mb-6 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Profile</h2>
            {error && <div className={`p-4 mb-4 text-red-500 ${isDarkTheme ? 'bg-gray-700' : 'bg-red-100'}`}>{error}</div>}
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className={`rounded-2xl shadow-lg p-6 ${isDarkTheme ? 'bg-gray-700 border-gray-600' : 'border-gray-100'}`}>
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
                        <div className="flex items-center space-x-3">
                            <Mail className={`w-5 h-5 ${isDarkTheme ? 'text-gray-300' : 'text-gray-500'}`} />
                            <span className={isDarkTheme ? 'text-gray-200' : 'text-gray-700'}>{profile.email || 'admin@nexus.com'}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Lock className={`w-5 h-5 ${isDarkTheme ? 'text-gray-300' : 'text-gray-500'}`} />
                            <span className={isDarkTheme ? 'text-gray-200' : 'text-gray-700'}>********</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <User className={`w-5 h-5 ${isDarkTheme ? 'text-gray-300' : 'text-gray-500'}`} />
                            <span className={isDarkTheme ? 'text-gray-200' : 'text-gray-700'}>
                                Permissions: {profile.permissions?.join(', ') || 'None'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileComponent;