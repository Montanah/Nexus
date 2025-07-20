import React, { useState } from 'react';
import { adminLogin } from '../api';
import { useAuth } from '../AuthContext';

const LoginPage = ({ isDarkTheme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await adminLogin(email, password);
      if (response.data) {
        console.log('Login response:', response.data?.admin);
        // Store token and admin data in localStorage
        localStorage.setItem('adminToken', response.data?.token);
        localStorage.setItem('adminData', JSON.stringify(response.data?.admin));
        
        // Update auth context
        login(response.data?.admin);
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response?.status === 429) {
        setError('Too many login attempts. Please try again later.');
      } else if (error.response?.status === 401) {
        setError('Invalid email or password');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${
      isDarkTheme ? 'bg-gray-900' : 'bg-gray-100'
    }`}>
      <form 
        onSubmit={handleLogin} 
        className={`shadow-lg rounded-lg p-8 w-full max-w-md ${
          isDarkTheme 
            ? 'bg-gray-800 text-white' 
            : 'bg-white text-gray-900'
        }`}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <input
          type="email"
          placeholder="Email"
          className={`w-full p-3 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isDarkTheme 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
        
        <input
          type="password"
          placeholder="Password"
          className={`w-full p-3 mb-6 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isDarkTheme 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
        
        <button 
          type="submit" 
          className={`w-full p-3 rounded font-medium transition-colors ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          } text-white`}
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;