import React from 'react';

const StatCard = ({ title, value, icon: Icon, color, change, isDarkTheme }) => {
  // Debug: Log to confirm isDarkTheme is received
  // console.log('isDarkTheme in StatCard:', isDarkTheme);

  return (
    <div className={`rounded-2xl p-6 shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 w-full ${
      isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
            change > 0 
              ? (isDarkTheme ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800')
              : (isDarkTheme ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800')
          }`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <h3 className={`text-sm font-medium mb-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>{title}</h3>
      <p className={`text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
};

export default StatCard;