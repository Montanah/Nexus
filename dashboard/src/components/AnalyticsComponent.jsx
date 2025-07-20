import React from 'react';
import StatCard from "./StatCard";
import { Users, ShoppingCart, BarChart3, UserCheck } from 'lucide-react';

const AnalyticsComponent = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        title="Revenue" 
        value="$45,231" 
        icon={BarChart3} 
        color="bg-gradient-to-r from-green-500 to-green-600"
        change={12}
      />
      <StatCard 
        title="Orders" 
        value="1,234" 
        icon={ShoppingCart} 
        color="bg-gradient-to-r from-blue-500 to-blue-600"
        change={8}
      />
      <StatCard 
        title="Active Users" 
        value="892" 
        icon={Users} 
        color="bg-gradient-to-r from-purple-500 to-purple-600"
        change={15}
      />
      <StatCard 
        title="Delivery Rate" 
        value="94%" 
        icon={UserCheck} 
        color="bg-gradient-to-r from-orange-500 to-orange-600"
        change={-2}
      />
    </div>

    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Analytics Overview</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Order Trends</h3>
          <p className="text-gray-600">Monthly order volume has increased by 18% compared to last month.</p>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-2">User Growth</h3>
          <p className="text-gray-600">New user registrations are up 25% with travelers leading the growth.</p>
        </div>
      </div>
    </div>
  </div>
);

export default AnalyticsComponent;