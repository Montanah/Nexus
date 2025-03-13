import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { fetchCart, deleteCartItem } from '../Services/api';

const CartPage = () => {
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cart items on mount
  useEffect(() => {
    const fetchCartData = async () => {
      if (!userId) {
        setError('User not authenticated');
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const items = await fetchCart(userId);
        setCartItems(items);

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

    fetchCartData();
  }, [userId, navigate]);

  // Handle deleting a cart item
  const handleDeleteItem = async (productId) => {
    try {
      setLoading(true);
      setError(null);
      await deleteCartItem(userId, productId); // Use deleteCartItem from api.js
      const updatedItems = await fetchCart(userId); // Refresh cart after deletion
      setCartItems(updatedItems);

      if (updatedItems.length === 0) {
        navigate('/client-dashboard');
      }
    } catch (err) {
      setError('Failed to remove item from cart');
      console.error('Error deleting cart item:', err);
    } finally {
      setLoading(false);
    }
  };

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
                {cartItems.map((item) => (
                  <li key={item.productId} className="flex justify-between items-center border-b pb-4">
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
                    <div className="flex items-center space-x-4">
                      <p className="text-lg font-semibold text-blue-600">${item.finalCharge.toFixed(2)}</p>
                      <button
                        onClick={() => handleDeleteItem(item.productId)}
                        className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                      >
                        Remove
                      </button>
                    </div>
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