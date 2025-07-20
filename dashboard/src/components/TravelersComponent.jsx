import { Users, Eye, Trash2, UserCheck, Phone, Mail, Shield, Star } from 'lucide-react';
import StatCard from './StatCard';
import React from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const TravelersComponent = ({ travelers, setTravelers, users, isDarkTheme }) => {
  const { admin } = useAuth(); // Add this line to get the admin object
    const navigate = useNavigate();
  
    const canReadUsers = admin?.permissions?.includes('travelers.read') || admin?.permissions?.includes('all');
    const canWriteUsers = admin?.permissions?.includes('travelers.write') || admin?.permissions?.includes('all');
  
    if (!canReadUsers) {
      return (
        <div className="p-6">
          <p className={`text-center text-red-500 font-semibold`}>
            You do not have permission to view travelers.
          </p>
        </div>
      );
    }
  const handleDelete = async (travelerId) => {
    if (!canWriteUsers) {
      alert('You do not have permission to delete users.');
      return;
    }
    setTravelers(travelers.filter(traveler => traveler._id !== travelerId));
  };

  const getUserDetails = (userId) => {
    const user = users.find(u => u._id === userId);
    return user || { name: 'Unknown', email: 'N/A', phone_number: 'N/A', isVerified: false };
  };

  const getRoleColor = (role) => {
    return role === 'traveler' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  const getStatusColor = (isVerified) => {
    return isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  // Calculate average rating from earnings.rating (assuming it's an array of numbers)
  const getAverageRating = (ratings) => {
    if (!ratings || !Array.isArray(ratings)) return 'N/A';
    const sum = ratings.reduce((acc, curr) => acc + (curr || 0), 0);
    return ratings.length > 0 ? (sum / ratings.length).toFixed(1) : 'N/A';
  };

  const handleView = (travelerId) => {
    navigate(`/travelers/${travelerId}`);
  };

  return (
    <div className={`space-y-6 w-full ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
      {/* Stats Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
        <StatCard 
          title="Total Travelers" 
          value={travelers.length} 
          icon={Users} 
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          change={12}
          isDarkTheme={isDarkTheme}
        />
        <StatCard 
          title="Travelers" 
          value={travelers.length} // All are travelers
          icon={UserCheck} 
          color="bg-gradient-to-r from-purple-500 to-purple-600"
          change={8}
          isDarkTheme={isDarkTheme}
        />
        <StatCard 
          title="Clients" 
          value={0} // Not applicable here
          icon={Shield} 
          color="bg-gradient-to-r from-green-500 to-green-600"
          change={5}
          isDarkTheme={isDarkTheme}
        />
        <StatCard 
          title="Verified" 
          value={travelers.filter(t => getUserDetails(t.userId).isVerified).length} 
          icon={Star} 
          color="bg-gradient-to-r from-orange-500 to-orange-600"
          change={15}
          isDarkTheme={isDarkTheme}
        />
      </div>

      {/* Travelers Table */}
      <div className={`rounded-2xl shadow-lg border overflow-hidden w-full ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className={`p-6 border-b ${isDarkTheme ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Traveler Management</h2>
          <p className={`text-gray-600 mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Manage all travelers in your platform</p>
        </div>
        
        <div className={`overflow-x-auto w-full ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
          <table className="w-full">
            <thead className={isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`text-left p-4 font-semibold ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Traveler</th>
                <th className={`text-left p-4 font-semibold ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Contact</th>
                <th className={`text-left p-4 font-semibold ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Role</th>
                <th className={`text-left p-4 font-semibold ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Status</th>
                <th className={`text-left p-4 font-semibold ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Ratings</th>
                <th className={`text-left p-4 font-semibold ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Total Earnings</th>
                <th className={`text-left p-4 font-semibold ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Pending Payments</th>
                <th className={`text-left p-4 font-semibold ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>History Count</th>
                <th className={`text-left p-4 font-semibold ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkTheme ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {travelers.map((traveler) => {
                const userDetails = getUserDetails(traveler.userId);
                const averageRating = getAverageRating(traveler.earnings?.rating);
                return (
                  <tr key={traveler._id} className={isDarkTheme ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {userDetails.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{userDetails.name}</p>
                          <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>{userDetails.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className={`flex items-center space-x-2 text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Mail className="w-4 h-4" />
                          <span>{userDetails.email}</span>
                        </div>
                        <div className={`flex items-center space-x-2 text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Phone className="w-4 h-4" />
                          <span>{userDetails.phone_number}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor('traveler')}`}>
                        traveler
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(userDetails.isVerified)}`}>
                        {userDetails.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isDarkTheme ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'}`}>
                        {averageRating}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isDarkTheme ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'}`}>
                        ${traveler.earnings?.totalEarnings || 0}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isDarkTheme ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'}`}>
                        ${traveler.earnings?.pendingPayments || 0}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isDarkTheme ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'}`}>
                        {traveler.history?.length || 0}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleView(traveler._id)} className={`p-2 ${isDarkTheme ? 'text-blue-400 hover:bg-blue-700' : 'text-blue-600 hover:bg-blue-50'} rounded-lg transition-colors`}>
                          <Eye className="w-4 h-4" />
                        </button>
                        {canWriteUsers && (
                        <button 
                          onClick={() => handleDelete(traveler._id)}
                          className={`p-2 ${isDarkTheme ? 'text-red-400 hover:bg-red-700' : 'text-red-600 hover:bg-red-50'} rounded-lg transition-colors`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TravelersComponent;