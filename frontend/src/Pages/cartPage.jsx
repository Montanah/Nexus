import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { fetchCart, deleteCartItem } from '../Services/api';
import Header from '../Components/Header';

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
      await deleteCartItem(userId, productId);
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
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100">
        <p className="text-gray-600">Loading cart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-purple-100">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-grow p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-indigo-900">Your Cart</h1>
            <Link
              to="/client-dashboard"
              className="bg-purple-600 text-white px-3 py-1 rounded-md text-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              Back to Dashboard
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            {cartItems.length === 0 ? (
              <p className="text-purple-700 text-center">Your cart is empty.</p>
            ) : (
              <>
                <ul className="space-y-4">
                  {cartItems.map((item) => (
                    <li key={item.productId} className="flex justify-between items-center border-b pb-4">
                      <div>
                        <h2 className="text-lg font-semibold text-indigo-900">{item.productName}</h2>
                        <p className="text-sm text-gray-700">Quantity: {item.quantity}</p>
                        <p className="text-sm text-gray-700">
                          Delivery: {item.delivery.country}, {item.delivery.city}, {item.delivery.town} - {item.delivery.deliveryDate}
                        </p>
                        {item.productDescription && (
                          <p className="text-sm text-gray-700">Description: {item.productDescription}</p>
                        )}
                        {item.category && (
                          <p className="text-sm text-gray-700">Category: {item.category}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <p className="text-lg font-semibold text-purple-700">${item.finalCharge.toFixed(2)}</p>
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
                  <p className="text-xl font-semibold text-indigo-900">Total:</p>
                  <p className="text-xl font-semibold text-purple-700">${totalPrice}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => navigate('/checkout')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
