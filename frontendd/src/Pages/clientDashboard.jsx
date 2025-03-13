import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { FaShoppingCart } from 'react-icons/fa';
import Sidebar from '../Components/Sidebar';
import UserProfile from '../Components/UserProfile';
import InputField from '../Components/DashboardInputField';
import PhotoUpload from '../Components/PhotoUpload';
import PriceBreakdown from '../Components/PriceBreakdown';
import ActionButtons from '../Components/ActionButtons';
import { checkout, addToCart, saveProduct, updateProduct } from '../Services/api';
import CountryStateCityComponent from '../Components/State';

const ClientDashboard = () => {
  const { userId, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
  const [finalCharge, setFinalCharge] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  const quantityOptions = Array.from({ length: 10 }, (_, i) => i + 1);
  const categoryOptions = ['Electronics', 'Clothing', 'Books', 'Accessories', 'Other'];

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
      setFinalCharge(itemToEdit.finalCharge || 0);
    }
  }, [location.state]);

  const calculateFinalCharge = () => {
    const basePrice = parseFloat(productPrice) || 0;
    const quantityMultiplier = quantity;
    const markup = 1.15;
    setFinalCharge(basePrice * quantityMultiplier * markup);
  };

  useEffect(() => {
    calculateFinalCharge();
  }, [productPrice, quantity]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleCheckout = async () => {
    const formData = {
      userId,
      productId,
      productName,
      quantity,
      finalCharge,
      delivery: { country, state, city, deliveryDate },
      productDescription,
      category,
      productPhotos: productPhotos.map((photo) => photo.name || photo),
      weight,
      dimensions,
      shippingRestrictions,
      productPrice,
    };

    try {
      setLoading(true);
      setError(null);
      const data = await checkout(formData);
      console.log('Checkout successful:', data);
      setSuccess('Checkout successful');
      return true;
    } catch (err) {
      setError('Checkout failed');
      console.error('Error during checkout:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    const formData = {
      userId,
      productId,
      productName,
      quantity,
      finalCharge,
      delivery: { country, state, city, deliveryDate },
      productDescription,
      category,
      productPhotos: productPhotos.map((photo) => photo.name || photo),
      weight,
      dimensions,
      shippingRestrictions,
      productPrice,
    };

    try {
      setLoading(true);
      setError(null);
      const data = await addToCart(formData);
      console.log('Added to cart:', data);
      setSuccess('Added to cart successfully');
      return true;
    } catch (err) {
      setError('Failed to add to cart');
      console.error('Error adding to cart:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productName || !country || !state || !city || !deliveryDate || !productPrice) {
      setError('Please fill all required fields');
      return;
    }

    const formData = {
      userId,
      productId,
      productName,
      quantity,
      finalCharge,
      delivery: { country, state, city, deliveryDate },
      productDescription,
      category,
      productPhotos: productPhotos.map((photo) => photo.name || photo),
      weight,
      dimensions,
      shippingRestrictions,
      productPrice,
    };

    try {
      setLoading(true);
      setError(null);
      let data;
      if (isEditing && productId) {
        data = await updateProduct(userId, productId, formData);
        console.log('Item updated:', data);
        setSuccess('Item updated successfully');
      } else {
        data = await saveProduct(formData);
        console.log('Product saved:', data);
        setSuccess('Product saved successfully');
      }
      setProductId(null);
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
      setFinalCharge(0);
      setIsEditing(false);
      navigate('/cart');
      return true;
    } catch (err) {
      setError(isEditing ? 'Failed to update item' : 'Failed to save product');
      console.error('Save error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await logout();
      if (result.success) {
        navigate('/login');
      } else {
        setError(result.error || 'Logout failed');
      }
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
            {isEditing ? 'Edit Product Listing' : 'Create Product Listing'}
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
        <form onSubmit={handleSaveProduct} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <InputField
              label="Product Name"
              value={productName}
              onChange={setProductName}
              placeholder="Enter product name"
              required
              className="w-full md:w-60 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
            <InputField
              label="Quantity"
              value={quantity}
              onChange={setQuantity}
              options={quantityOptions}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
            className="w-full md:w-35 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            />
            <InputField
              label="Dimensions (Optional)"
              value={dimensions}
              onChange={setDimensions}
              placeholder="L x W x H"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
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
            finalCharge={finalCharge}
          />
          <ActionButtons
            onAddToCart={handleAddToCart}
            onCheckout={handleCheckout}
            onSave={handleSaveProduct}
          />
        </form>
      </div>
      <UserProfile userId={userId} />
    </div>
  );
};

export default ClientDashboard;