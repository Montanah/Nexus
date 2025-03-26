import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { FaShoppingCart, FaPlus, FaMinus, FaBox } from 'react-icons/fa';
import Sidebar from '../Components/Sidebar';
import UserProfile from '../Components/UserProfile';
import InputField from '../Components/DashboardInputField';
import PhotoUpload from '../Components/PhotoUpload';
import PriceBreakdown from '../Components/PriceBreakdown';
import ActionButtons from '../Components/ActionButtons';
import { checkout, addToCart, saveProduct, updateProduct, getCategories } from '../Services/api';
import CountryStateCityComponent from '../Components/State';

const NewOrder = () => {
  const { userId, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // State for single product input
  const [productId, setProductId] = useState(null);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [productDescription, setProductDescription] = useState('');
  const [category, setCategory] = useState('');
  const [productPhotos, setProductPhotos] = useState([]);
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [shippingRestrictions, setShippingRestrictions] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // State for cart (multiple items)
  const [cart, setCart] = useState([]);

  const quantityOptions = Array.from({ length: 10 }, (_, i) => i + 1);
  
   // Fetch categories
  const [categoryOptions, setCategoryOptions] = useState([]);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        setCategoryOptions(response.data.categories);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Load item to edit (if any)
  useEffect(() => {
    const { itemToEdit } = location.state || {};
    if (itemToEdit) {
      setIsEditing(true);
      setProductId(itemToEdit.productId || null);
      setProductName(itemToEdit.productName || '');
      setQuantity(itemToEdit.quantity || 1);
      setProductDescription(itemToEdit.productDescription || '');
      setCategory(itemToEdit.category || '');
      setProductPhotos(itemToEdit.productPhotos || []);
      setWeight(itemToEdit.weight || '');
      setDimensions(itemToEdit.dimensions || '');
      setCountry(itemToEdit.delivery?.country || '');
      setState(itemToEdit.delivery?.state || '');
      setCity(itemToEdit.delivery?.city || '');
      setDeliveryDate(itemToEdit.delivery?.deliveryDate || '');
      setShippingRestrictions(itemToEdit.shippingRestrictions || '');
      setProductPrice(itemToEdit.productPrice || '');
    }
  }, [location.state]);

  // Calculate final charge for a single item
  const calculateFinalCharge = useCallback((price, qty) => {
    const basePrice = parseFloat(price) || 0;
    const quantityMultiplier = parseInt(qty) || 0;
    const markup = 1.15;
    return basePrice * quantityMultiplier * markup; // Return number, not string
  }, []);

  // Add item to cart
  const handleAddItemToCart = () => {
    if (!productName || !productPrice || !country || !state || !city || !deliveryDate) {
      setError('Please fill all required fields');
      return;
    }

    const newItem = {
      userId,
      productId,
      productName,
      quantity,
      finalCharge: calculateFinalCharge(productPrice, quantity),
      delivery: { country, state, city, deliveryDate },
      productDescription,
      category,
      productPhotos: productPhotos.map(photo => photo.name || photo),
      weight,
      dimensions,
      shippingRestrictions,
      productPrice,
    };

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productName === newItem.productName);
      if (existingItem) {
        return prevCart.map(item =>
          item.productName === newItem.productName
            ? { ...item, quantity: item.quantity + quantity, finalCharge: calculateFinalCharge(productPrice, item.quantity + quantity) }
            : item
        );
      }
      return [...prevCart, newItem];
    });

    // Reset form after adding
    setProductName('');
    setQuantity(1);
    setProductDescription('');
    setCategory('');
    setProductPhotos([]);
    setWeight('');
    setDimensions('');
    setCountry('');
    setState('');
    setCity('');
    setDeliveryDate('');
    setShippingRestrictions('');
    setProductPrice('');
    setIsEditing(false);
  };

  // Remove item or decrease quantity from cart
  const removeFromCart = (itemId) => {
    const existingItem = cart.find(cartItem => cartItem.productId === itemId || cartItem.productName === itemId);
    if (existingItem.quantity > 1) {
      setCart(cart.map(cartItem =>
        cartItem.productId === itemId || cartItem.productName === itemId
          ? { ...cartItem, quantity: cartItem.quantity - 1, finalCharge: calculateFinalCharge(cartItem.productPrice, cartItem.quantity - 1) }
          : cartItem
      ));
    } else {
      setCart(cart.filter(cartItem => cartItem.productId !== itemId && cartItem.productName !== itemId));
    }
  };

  // Total calculation
  const total = cart.reduce((sum, item) => sum + parseFloat(item.finalCharge), 0).toFixed(2);

  // API Handlers
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      console.log('Checkout formData:', { userId, cart });
      const data = await checkout({ userId, cart });
      console.log('Checkout response:', data);
      setSuccess('Checkout successful');
      setCart([]);
      navigate('/payment-success', { state: { cart, total, paymentMethod: 'Pending', orderNumber: data.orderNumber } });
    } catch (err) {
      setError('Checkout failed: ' + (err.response?.data?.message || err.message));
      console.error('Error during checkout:', err.response || err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await addToCart({ userId, cart });
      console.log('Added to cart:', data);
      setSuccess('Added to cart successfully');
      setCart([]);
      navigate('/cart');
    } catch (err) {
      setError('Failed to add to cart');
      console.error('Error adding to cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    handleAddItemToCart(); // Add to local cart first
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      setError(null);
      await logout();
      navigate('/login');
    } catch (err) {
      setError('Logout failed');
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-indigo-100 flex items-center justify-center">
        <p>Loading authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 flex flex-col lg:flex-row relative">
      <Sidebar />
      <div className="flex-1 p-4 sm:p-6 md:p-8 pb-24 sm:pb-28 md:pb-32 lg:ml-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-600">
            {isEditing ? 'Edit Product Listing' : 'Create New Order'}
          </h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <Link
              to="/cart"
              className="flex items-center justify-center bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full sm:w-auto"
            >
              <FaShoppingCart className="mr-2" />
              Cart
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-md text-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full sm:w-auto"
            >
              Logout
            </button>
          </div>
        </div>
        {loading && <p className="text-gray-600 text-center">Loading...</p>}
        {error && <p className="text-red-500 text-center">{error}</p>}
        {success && <p className="text-green-500 text-center">{success}</p>}

        {/* Form for adding new item */}
        <form onSubmit={handleSaveProduct} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <InputField
              label="Product Name"
              value={productName}
              onChange={setProductName}
              placeholder="Enter product name"
              required
              className="w-full md:w-60 px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
            <InputField
              label="Quantity"
              value={quantity}
              onChange={setQuantity}
              options={quantityOptions}
              className="w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
          </div>
          <InputField
            label="Product Description"
            value={productDescription}
            onChange={setProductDescription}
            placeholder="Describe your product"
            rows={4}
            className="w-full md:w-1/2 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
          />
          <InputField
            label="Category"
            value={category}
            onChange={setCategory}
            options={categoryOptions}
            className="w-full md:w-35 px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
          />
          <PhotoUpload
            photos={productPhotos}
            setPhotos={setProductPhotos}
            className="w-full md:w-1/2 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
          />
          <div className="flex flex-col md:flex-row gap-4">
            <InputField
              label="Weight (Optional)"
              value={weight}
              onChange={setWeight}
              placeholder="Enter weight"
              className="w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
            <InputField
              label="Dimensions (Optional)"
              value={dimensions}
              onChange={setDimensions}
              placeholder="L x W x H"
              className="w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
          </div>
          <div className="space-y-4">
            <h2 className="text-lg md:text-xl font-semibold text-blue-600">
              Delivery Destination
            </h2>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <CountryStateCityComponent
                selectedCountry={country}
                setSelectedCountry={setCountry}
                selectedState={state}
                setSelectedState={setState}
                selectedCity={city}
                setSelectedCity={setCity}
              />
              <InputField
                label="Delivery Date"
                type="date"
                value={deliveryDate}
                onChange={setDeliveryDate}
                required
                className="w-full md:w-32 px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
              />
            </div>
          </div>
          <InputField
            label="Shipping Restrictions (Optional)"
            value={shippingRestrictions}
            onChange={setShippingRestrictions}
            placeholder="Any special shipping instructions"
            rows={3}
            className="w-full md:w-1/2 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
          />
          <PriceBreakdown
            productPrice={productPrice}
            setProductPrice={setProductPrice}
            finalCharge={calculateFinalCharge(productPrice, quantity)}
            cart={cart}
          />
          <button
            type="button"
            onClick={handleAddItemToCart}
            className="justify-center bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full sm:w-auto"
          >
            Add Item to Cart
          </button>
        </form>

        {/* Cart Display */}
        <div className="mt-6 bg-cyan-200 rounded-xl shadow-md p-6">
          <h3 className="text-lg md:text-xl font-semibold text-blue-600 mb-4">Your Cart</h3>
          {cart.length === 0 ? (
            <p className="text-gray-600 text-center">Your cart is empty.</p>
          ) : (
            <>
              <ul className="space-y-4">
                {cart.map((item, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      {item.productPhotos.length > 0 ? (
                        <img src={item.productPhotos[0]} alt={item.productName} className="w-12 h-12 object-cover rounded mr-4" />
                      ) : (
                        <FaBox className="text-indigo-600 text-2xl mr-4" />
                      )}
                      <div>
                        <p className="text-gray-900 font-medium">{item.productName}</p>
                        <p className="text-gray-600 text-sm">
                          ${item.productPrice} x {item.quantity} = ${item.finalCharge.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => removeFromCart(item.productId || item.productName)}
                        className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        <FaMinus />
                      </button>
                      <span className="text-gray-700">{item.quantity}</span>
                      <button
                        onClick={() => {
                          setCart(cart.map(cartItem =>
                            cartItem.productName === item.productName
                              ? { ...cartItem, quantity: cartItem.quantity + 1, finalCharge: calculateFinalCharge(cartItem.productPrice, cartItem.quantity + 1) }
                              : cartItem
                          ));
                        }}
                        className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        <FaPlus />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex justify-between items-center">
                <p className="text-lg md:text-xl font-semibold text-blue-600">Total: ${total}</p>
                <ActionButtons
                  onAddToCart={handleAddToCart}
                  onCheckout={handleCheckout}
                  onSave={handleSaveProduct}
                />
              </div>
            </>
          )}
        </div>
      </div>
      <UserProfile userId={userId} />
    </div>
  );
};

export default NewOrder;