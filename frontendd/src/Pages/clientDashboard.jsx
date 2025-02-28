import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaShoppingCart } from 'react-icons/fa';
import Sidebar from '../Components/Sidebar';
import UserProfile from '../Components/UserProfile';
import InputField from '../Components/DashboardInputField';
import PhotoUpload from '../Components/PhotoUpload';
import PriceBreakdown from '../Components/PriceBreakdown';
import ActionButtons from '../Components/ActionButtons';

const ClientDashboard = () => {
  const { userId, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [productId, setProductId] = useState(null); // Added for editing
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [productDescription, setProductDescription] = useState('');
  const [category, setCategory] = useState('');
  const [productPhotos, setProductPhotos] = useState([]);
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [town, setTown] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [shippingRestrictions, setShippingRestrictions] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [finalCharge, setFinalCharge] = useState(0);

  const [countryOptions, setCountryOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [townOptions, setTownOptions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const quantityOptions = Array.from({ length: 10 }, (_, i) => i + 1);
  const categoryOptions = ['Electronics', 'Clothing', 'Books', 'Accessories', 'Other'];

  // Prefill form with itemToEdit if present
  useEffect(() => {
    const { itemToEdit } = location.state || {};
    if (itemToEdit) {
      setIsEditing(true);
      setProductId(itemToEdit.productId || null); // Store productId
      setProductName(itemToEdit.productName || '');
      setQuantity(itemToEdit.quantity || 1);
      setProductDescription(itemToEdit.productDescription || '');
      setCategory(itemToEdit.category || '');
      setProductPhotos(itemToEdit.productPhotos || []);
      setWeight(itemToEdit.weight || '');
      setDimensions(itemToEdit.dimensions || '');
      setCountry(itemToEdit.delivery?.country || '');
      setCity(itemToEdit.delivery?.city || '');
      setTown(itemToEdit.delivery?.town || '');
      setDeliveryDate(itemToEdit.delivery?.deliveryDate || '');
      setShippingRestrictions(itemToEdit.shippingRestrictions || '');
      setProductPrice(itemToEdit.productPrice || '');
      setFinalCharge(itemToEdit.finalCharge || 0);
    }
  }, [location.state]);

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/countries');
        setCountryOptions(response.data.countries || []);
      } catch (err) {
        setError('Failed to load countries');
        console.error('Error fetching countries:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);

  // Fetch cities when country changes
  useEffect(() => {
    if (!country) {
      setCityOptions([]);
      setCity('');
      return;
    }
    const fetchCities = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/cities/${country}`);
        setCityOptions(response.data.cities || []);
        if (!isEditing) setCity('');
      } catch (err) {
        setError('Failed to load cities');
        console.error('Error fetching cities:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCities();
  }, [country, isEditing]);

  // Fetch towns when country or city changes
  useEffect(() => {
    if (!country || !city) {
      setTownOptions([]);
      setTown('');
      return;
    }
    const fetchTowns = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/towns/${country}/${city}`);
        setTownOptions(response.data.towns || []);
        if (!isEditing) setTown('');
      } catch (err) {
        setError('Failed to load towns');
        console.error('Error fetching towns:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTowns();
  }, [country, city, isEditing]);

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

  const checkout = async () => {
    const formData = {
      userId,
      productId,
      productName,
      quantity,
      finalCharge,
      delivery: { country, city, town, deliveryDate },
      productDescription,
      category,
      productPhotos: productPhotos.map(photo => photo.name || photo),
      weight,
      dimensions,
      shippingRestrictions,
      productPrice,
    };

    try {
      setLoading(true);
      setError(null);
      const response = await axios.post('/api/checkout', formData);
      console.log('Checkout successful:', response.data);
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

  const addToCart = async () => {
    const formData = {
      userId,
      productId,
      productName,
      quantity,
      finalCharge,
      delivery: { country, city, town, deliveryDate },
      productDescription,
      category,
      productPhotos: productPhotos.map(photo => photo.name || photo),
      weight,
      dimensions,
      shippingRestrictions,
      productPrice,
    };

    try {
      setLoading(true);
      setError(null);
      const response = await axios.post('/api/cart', formData);
      console.log('Added to cart:', response.data);
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

  const saveProduct = async (e) => {
    e.preventDefault();
    if (!productName || !country || !city || !town || !deliveryDate || !productPrice) {
      setError('Please fill all required fields');
      return;
    }

    const formData = {
      userId,
      productId,
      productName,
      quantity,
      finalCharge,
      delivery: { country, city, town, deliveryDate },
      productDescription,
      category,
      productPhotos: productPhotos.map(photo => photo.name || photo),
      weight,
      dimensions,
      shippingRestrictions,
      productPrice,
    };

    try {
      setLoading(true);
      setError(null);
      let response;
      if (isEditing && productId) {
        // Update existing item using productId
        response = await axios.put(`/api/cart/${userId}/${productId}`, formData);
        console.log('Item updated:', response.data);
        setSuccess('Item updated successfully');
      } else {
        // Create new item
        response = await axios.post('/api/products', formData);
        console.log('Product saved:', response.data);
        setSuccess('Product saved successfully');
      }
      // Reset form
      setProductId(null);
      setProductName('');
      setQuantity(1);
      setProductDescription('');
      setCategory('');
      setProductPhotos([]);
      setWeight('');
      setDimensions('');
      setCountry('');
      setCity('');
      setTown('');
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
    setLoading(true);
    setError(null);
    const baseurl = import.meta.env.VITE_API_KEY;
    const response = await axios.post(`${baseurl}/auth/logout`)
    // const result = await logout();
    if (response.status === 200 || response.status === 201){
    // if (result.success) {
      navigate('/login');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-indigo-100 flex items-center justify-center">
        <p>Loading authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-blue-600">
            {isEditing ? 'Edit Product Listing' : 'Create Product Listing'}
          </h1>
          <div className="flex space-x-2">
            <Link
              to="/cart"
              className="flex items-center bg-blue-500 text-white px-5 py-2 rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <FaShoppingCart className="mr-2" />
              Cart
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-5 py-2 rounded-md text-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              LogOut
            </button>
          </div>
        </div>
        {loading && <p className="text-gray-600">Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">{success}</p>}
        <form onSubmit={saveProduct} className="space-y-6">
          <div className="flex flex-row gap-4">
            <InputField
              label="Product Name"
              value={productName}
              onChange={setProductName}
              placeholder="Enter product name"
              required
              className="w-60 px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <InputField
              label="Quantity"
              value={quantity}
              onChange={setQuantity}
              options={quantityOptions}
              className="w-full px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <InputField
            label="Product Description"
            value={productDescription}
            onChange={setProductDescription}
            placeholder="Describe your product"
            rows={4}
            className="w-1/2 px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <InputField
            label="Category"
            value={category}
            onChange={setCategory}
            options={categoryOptions}
            className="w-35 px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <PhotoUpload
            photos={productPhotos}
            setPhotos={setProductPhotos}
            className="w-1/2 px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <div className="flex flex-row gap-4">
            <InputField
              label="Weight (Optional)"
              value={weight}
              onChange={setWeight}
              placeholder="Enter weight"
              className="w-full px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <InputField
              label="Dimensions (Optional)"
              value={dimensions}
              onChange={setDimensions}
              placeholder="L x W x H"
              className="w-full px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-blue-600">Delivery Destination</h2>
            <div className="flex flex-row gap-4">
              <InputField
                label="Country"
                value={country}
                onChange={setCountry}
                options={countryOptions}
                required
                disabled={loading}
                className="w-48 px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <InputField
                label="City"
                value={city}
                onChange={setCity}
                options={cityOptions}
                required
                disabled={loading || !country}
                className="w-48 px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <InputField
                label="Town"
                value={town}
                onChange={setTown}
                options={townOptions}
                required
                disabled={loading || !city}
                className="w-48 px-1 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <InputField
                label="Delivery Date"
                type="date"
                value={deliveryDate}
                onChange={setDeliveryDate}
                required
                className="w-32 px-1 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          <InputField
            label="Shipping Restrictions (Optional)"
            value={shippingRestrictions}
            onChange={setShippingRestrictions}
            placeholder="Any special shipping instructions"
            rows={3}
            className="w-1/2 px-1 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <PriceBreakdown
            productPrice={productPrice}
            setProductPrice={setProductPrice}
            finalCharge={finalCharge}
          />
          <ActionButtons
            onAddToCart={addToCart}
            onCheckout={checkout}
            onSave={saveProduct}
          />
        </form>
      </div>
      <UserProfile userId={userId} />
    </div>
  );
};

export default ClientDashboard;