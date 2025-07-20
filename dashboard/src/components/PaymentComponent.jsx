import StatCard from "./StatCard";
import React, {useState, useEffect} from "react";
import { useAuth } from '../AuthContext';
import { RoleGuard } from '../AuthContext';
import { ShoppingCart, UserCheck, BarChart3, CreditCard, Pencil, Trash2} from 'lucide-react';
import { fetchTransactions } from "../api";

const PaymentComponent = ({ orders, setOrders, users, isDarkTheme }) => {
  const { admin: currentAdmin } = useAuth();
  const [trans, setTrans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
      const fetchTrans = async () => {
        setIsLoading(true);
        setError('');
        try {
          const transData = await fetchTransactions();
          console.log("admindata", transData);
          setTrans(transData);
        } catch (err) {
          setError('Failed to fetch transactions. Please try again.');
          console.error('Fetch transactions error:', err);
        } finally {
          setIsLoading(false);
        }
      };
  
      fetchTrans();
    }, []);
  
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_transit: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Map userId to name
  const getUserName = (userId) => {
    const user = users.find(u => u._id === userId);
    return user ? user.name : 'Unknown';
  };

  return (
    <div className={`space-y-6 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
        <StatCard 
          title="Total Orders" 
          value={orders.length} 
          icon={ShoppingCart} 
          color="bg-gradient-to-r from-pink-500 to-pink-600"
          change={18}
          isDarkTheme={isDarkTheme}
        />
        <StatCard 
          title="Delivered" 
          value={orders.reduce((sum, o) => sum + o.items.filter(i => i.deliveryStatus === 'Complete').length, 0)} 
          icon={UserCheck} 
          color="bg-gradient-to-r from-green-500 to-green-600"
          change={25}
          isDarkTheme={isDarkTheme}
        />
        <StatCard 
          title="Revenue" 
          value={`KES ${orders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}`} 
          icon={BarChart3} 
          color="bg-gradient-to-r from-emerald-500 to-emerald-600"
          change={31}
          isDarkTheme={isDarkTheme}
        />
        <StatCard 
          title="Pending Payments" 
          value={orders.reduce((sum, o) => sum + o.items.filter(i => i.deliveryStatus === 'pending').length, 0)} 
          icon={CreditCard}
          color="bg-gradient-to-r from-yellow-500 to-yellow-600"
          change={5}
          isDarkTheme={isDarkTheme}
        />
        <StatCard 
          title="Disputed Payments" 
          value={orders.reduce((sum, o) => sum + o.items.filter(i => i.deliveryStatus === 'disputed').length, 0)} 
          icon={CreditCard}
          color="bg-gradient-to-r from-red-500 to-red-600"
          change={-2}
          isDarkTheme={isDarkTheme}
        />
        <StatCard 
          title="Total Payments" 
          value={orders.reduce((sum, o) => sum + o.items.filter(i => i.deliveryStatus === 'disputed').length, 0)} 
          icon={CreditCard}
          color="bg-gradient-to-r from-red-500 to-red-600"
          change={-2}
          isDarkTheme={isDarkTheme}
        />
      </div>

        <div className={`rounded-2xl shadow-lg border overflow-hidden ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className={`p-6 border-b ${isDarkTheme ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Transaction Management</h2>
            <p className={`text-gray-600 mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Transaction History</p>
          </div>
          <table className="w-full">
            <thead className={isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`text-left p-4 ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Transaction ID</th>
                <th className={`text-left p-4 ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Payment Method</th>
                <th className={`text-left p-4 ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Amount</th>
                <th className={`text-left p-4 ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Date</th>
                <th className={`text-left p-4 ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Status</th>
                <th className={`text-left p-4 ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={isDarkTheme ? 'divide-gray-700' : 'divide-gray-100'}>
                  {trans.map((tran) => (
                    <tr key={tran._id} className={isDarkTheme ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}>
                      <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>{tran._id}</td>
                      <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>{tran.paymentMethod}</td>
                      <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>{tran.amount}</td>
                      <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>{tran.createdAt}</td>
                      <td className={`p-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-800'}`}>{tran.status}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleEdit(tran)}
                          className={`mr-2 p-2 rounded ${isDarkTheme ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-500 hover:bg-yellow-600'} text-white`}
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        {currentAdmin._id !== tran._id && (
                          <button
                            onClick={() => handleDelete(tran._id)}
                            className={`p-2 rounded ${isDarkTheme ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

            </tbody>
          </table>
        </div>
      </div>
    
  );
};

export default PaymentComponent;