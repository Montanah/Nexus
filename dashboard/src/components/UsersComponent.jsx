import { Users, Eye, Trash2, UserCheck, Phone, Mail, Shield, Star } from 'lucide-react';
import StatCard from './StatCard';
import React from 'react';
import { useAuth } from '../AuthContext'; 
import { useNavigate } from 'react-router-dom';

const UsersComponent = ({ users, setUsers, isDarkTheme }) => {
  const { admin } = useAuth(); 
  const navigate = useNavigate();
  
  const canReadUsers = admin?.permissions?.includes('users.read') || admin?.permissions?.includes('all');
  const canWriteUsers = admin?.permissions?.includes('users.write') || admin?.permissions?.includes('all');

  if (!canReadUsers) {
    return (
      <div className="p-6">
        <p className={`text-center text-red-500 font-semibold`}>
          You do not have permission to view users.
        </p>
      </div>
    );
  }

  const handleDelete = async (userId) => {
    if (!canWriteUsers) {
      alert('You do not have permission to delete users.');
      return;
    }
    setUsers(users.filter(user => user._id !== userId));
  };

  const handleView = (userId) => {
    navigate(`/users/${userId}`); // Navigate to UserDetails page with userId
  };

  const getRoleColor = (role) => {
    return role === 'traveler' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  const getStatusColor = (isVerified) => {
    return isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className={`space-y-6 w-full ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
      {/* Stats Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
        <StatCard 
          title="Total Users" 
          value={users.length} 
          icon={Users} 
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          change={12}
          isDarkTheme={isDarkTheme}
        />
        <StatCard 
          title="Travelers" 
          value={users.filter(u => u.role === 'traveler').length} 
          icon={UserCheck} 
          color="bg-gradient-to-r from-purple-500 to-purple-600"
          change={8}
          isDarkTheme={isDarkTheme}
        />
        <StatCard 
          title="Clients" 
          value={users.filter(u => u.role === 'client').length} 
          icon={Shield} 
          color="bg-gradient-to-r from-green-500 to-green-600"
          change={5}
          isDarkTheme={isDarkTheme}
        />
        <StatCard 
          title="Verified" 
          value={users.filter(u => u.isVerified).length} 
          icon={Star} 
          color="bg-gradient-to-r from-orange-500 to-orange-600"
          change={15}
          isDarkTheme={isDarkTheme}
        />
      </div>

      {/* Users Table */}
      <div className={`rounded-2xl shadow-lg border overflow-hidden w-full ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className={`p-6 border-b ${isDarkTheme ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>User Management</h2>
          <p className={`text-gray-600 mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Manage all users in your platform</p>
        </div>
        
        <div className={`overflow-x-auto w-full ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
          <table className="w-full">
            <thead className={isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`text-left p-4 font-semibold ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>User</th>
                <th className={`text-left p-4 font-semibold ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Contact</th>
                <th className={`text-left p-4 font-semibold ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Role</th>
                <th className={`text-left p-4 font-semibold ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Status</th>
                <th className={`text-left p-4 font-semibold ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkTheme ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {users.map((user) => (
                <tr key={user._id} className={isDarkTheme ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                        <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className={`flex items-center space-x-2 text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                      <div className={`flex items-center space-x-2 text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Phone className="w-4 h-4" />
                        <span>{user.phone_number}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(user.isVerified)}`}>
                      {user.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleView(user._id)}
                        className={`p-2 ${isDarkTheme ? 'text-blue-400 hover:bg-blue-700' : 'text-blue-600 hover:bg-blue-50'} rounded-lg transition-colors`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canWriteUsers && (
                        <button 
                          onClick={() => handleDelete(user._id)}
                          className={`p-2 ${isDarkTheme ? 'text-red-400 hover:bg-red-700' : 'text-red-600 hover:bg-red-50'} rounded-lg transition-colors`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
 );
};

export default UsersComponent;