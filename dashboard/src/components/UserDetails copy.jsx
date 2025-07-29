import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const UserDetails = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    // Fetch user details
    axios.get(`/api/admin/users/${id}`)
      .then(res => setUser(res.data))
      .catch(err => console.error(err));

    // Fetch user orders
    axios.get(`/api/admin/users/${id}/orders`)
      .then(res => {
        setOrders(res.data);
        // Calculate total spent (including 15% markup)
        const total = res.data.reduce((sum, order) => sum + order.total, 0);
        setTotalSpent(total);
      })
      .catch(err => console.error(err));
  }, [id]);

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">User Details</h2>
      <Link to="/users" className="text-blue-500 hover:underline mb-4 inline-block">Back to Users</Link>
      <div className="bg-white p-6 rounded shadow mb-6">
        <h3 className="text-xl font-semibold">User Information</h3>
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
      </div>
      <div className="bg-white p-6 rounded shadow mb-6">
        <h3 className="text-xl font-semibold">Total Amount Spent</h3>
        <p className="text-2xl">${totalSpent.toFixed(2)}</p>
      </div>
      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-xl font-semibold mb-4">Orders</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Order ID</th>
              <th className="border p-2">Total</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td className="border p-2">{order.id}</td>
                <td className="border p-2">${order.total.toFixed(2)}</td>
                <td className="border p-2">{order.status}</td>
                <td className="border p-2">{new Date(order.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserDetails;