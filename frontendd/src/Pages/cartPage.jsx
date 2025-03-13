import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';
import { Link } from 'react-router-dom';

const CartPage = () => {
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cart items on mount
  useEffect(() => {
    const fetchCart = async () => {
      if (!userId) {
        setError('User not authenticated');
        navigate('/login'); // Redirect if no userId
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`/api/cart/${userId}`);
        const items = response.data.items || [];
        setCartItems(items);

        // Redirect if cart is empty
        if (items.length === 0) {
          navigate('/client-dashboard');
        }
      } catch (err) {
        setError('Failed to load cart');
        console.error('Error fetching cart:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [userId, navigate]);

  // Calculate total price
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.finalCharge || 0), 0).toFixed(2);

  if (loading) {
    return (
      <div className="min-h-screen bg-indigo-100 flex items-center justify-center">
        <p className="text-gray-600">Loading cart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-indigo-100 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">Your Cart</h1>
          <Link
            to="/client-dashboard"
            className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Back to Dashboard
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          {cartItems.length === 0 ? (
            <p className="text-gray-600">Your cart is empty.</p>
          ) : (
            <>
              <ul className="space-y-4">
                {cartItems.map((item, index) => (
                  <li key={index} className="flex justify-between items-center border-b pb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">{item.productName}</h2>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-600">
                        Delivery: {item.delivery.country}, {item.delivery.city}, {item.delivery.town} - {item.delivery.deliveryDate}
                      </p>
                      {item.productDescription && (
                        <p className="text-sm text-gray-600">Description: {item.productDescription}</p>
                      )}
                      {item.category && (
                        <p className="text-sm text-gray-600">Category: {item.category}</p>
                      )}
                    </div>
                    <p className="text-lg font-semibold text-blue-600">${item.finalCharge.toFixed(2)}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex justify-between items-center">
                <p className="text-xl font-semibold text-gray-800">Total:</p>
                <p className="text-xl font-semibold text-blue-600">${totalPrice}</p>
              </div>
              <div className="mt-4 flex justify-end">
                <Link
                  to="/checkout-success"
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  Proceed to Checkout
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartPage;