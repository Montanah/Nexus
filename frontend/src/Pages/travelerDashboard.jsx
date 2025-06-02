import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Components/SideBar';
import UserProfile from '../Components/UserProfile';
import ProductDetails from './productDetails';
import CountryStateCityComponent from '../Components/State';
import PhotoUpload from '../Components/PhotoUpload';
import { getAvailableProducts, getCategories, getTravelerEarnings, getTravelerOrders, updateDeliveryStatus, uploadDeliveryProof } from '../Services/api';

const DELIVERY_STATUS = {
  ASSIGNED: 'Assigned',
  SHIPPED: 'Shipped',
  TRAVELER_CONFIRMED: 'Traveler Confirmed',
  CLIENT_CONFIRMED: 'Client Confirmed',
  COMPLETE: 'Complete',
};

const TravelerDashboard = () => {
  const navigate = useNavigate();
  const { userId, logout, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [filters, setFilters] = useState({ category: 'All', country: '', city: '', priceMin: '', priceMax: '', urgency: '' });
  const [earnings, setEarnings] = useState({ totalEarnings: '0.00', pendingPayments: '0.00', rating: { average: 0, count: 0 } });
  const [period, setPeriod] = useState('all');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [categories, setCategories] = useState(['All']);
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productPhotos, setProductPhotos] = useState({});
  const [uploadError, setUploadError] = useState(null);
  const [confirming, setConfirming] = useState({});
  const [uploading, setUploading] = useState({});

  // Fetch available products, categories, and earnings
  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) {
        console.log('Auth loading, skipping fetch');
        return;
      }
      if (!userId) {
        console.log('No userId, navigating to login');
        navigate('/login');
        return;
      }
      try {
        setLoading(true);
        setError(null);

        const [productsData, categoriesData, earningsData, travelerOrders] = await Promise.all([
          getAvailableProducts(),
          getCategories(),
          getTravelerEarnings(userId),
          getTravelerOrders(userId),
        ]);
        console.log('Products data:', productsData);
        console.log('Categories data:', categoriesData);
        console.log('Earnings data:', earningsData);
        console.log('Traveler orders:', travelerOrders);

        const mappedProducts = productsData.map(product => ({
          productId: product?._id || '',
          productName: product?.productName || 'Unnamed Product',
          destination: {
            country: product?.destination?.country || '',
            state: product?.destination?.state || '',
            city: product?.destination?.city || ''
          },
          deliveryDate: product?.deliverydate || '',
          productPrice: parseFloat(product?.totalPrice) || 0,
          rewardAmount: parseFloat(product?.productMarkup) || 0,
          urgencyLevel: product?.urgencyLevel || 'low',
          productPhotos: product?.productPhotos || [],
          categoryName: product?.categoryName || 'Uncategorized',
          deliveryStatus: product?.deliveryStatus || '',
        }));

        const mappedSelectedProducts = travelerOrders.map(order => ({
          productId: order?._id || '',
          productName: order?.productName || 'Unnamed Product',
          destination: {
            country: order?.destination?.country || '',
            state: order?.destination?.state || '',
            city: order?.destination?.city || ''
          },
          deliveryStatus: order?.deliveryStatus || DELIVERY_STATUS.ASSIGNED,
          isDelivered: order?.isDelivered || false,
          productPrice: parseFloat(order?.totalPrice) || 0,
          rewardAmount: parseFloat(order?.productMarkup) || 0,
          urgencyLevel: order?.urgencyLevel || 'low',
          productPhotos: order?.productPhotos || [],
          categoryName: order?.categoryName || 'Uncategorized',
        }));

        console.log('Mapped products:', mappedProducts);
        setProducts(mappedProducts);
        setSelectedProducts(mappedSelectedProducts);
        const categoryList = Array.isArray(categoriesData)
          ? ['All', ...categoriesData.map(cat => cat.categoryName)]
          : ['All'];
        console.log('Category list:', categoryList);
        setCategories(categoryList);
        setEarnings(earningsData);
      } catch (err) {
        console.error('Fetch data error:', err);
        if (err.response?.status === 401) {
          console.log('Unauthorized, navigating to login');
          navigate('/login');
        } else if (err.response?.status === 404) {
          setError('No Products available now. Please check again later.');
        } else {
          setError(err.response?.data?.message || 'Failed to load data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    console.log('Fetching data...', userId);
  }, [userId, period, authLoading, navigate]);

  useEffect(() => {
    setFilters(prev => ({ ...prev, country, state, city }));
  }, [country, state, city]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory =
        filters.category === 'All' || product.categoryName === filters.category;
      const matchesCountry =
        !filters.country || product.destination.country === filters.country;
      const matchesState = !filters.state || product.destination.state === filters.state;
      const matchesCity = !filters.city || product.destination.city === filters.city;
      const matchesPriceMin =
        !filters.priceMin || product.productPrice >= Number(filters.priceMin);
      const matchesPriceMax =
        !filters.priceMax || product.productPrice <= Number(filters.priceMax);
      const matchesUrgency =
        !filters.urgency || product.urgencyLevel === filters.urgency;
      return (
        matchesCategory &&
        matchesCountry &&
        matchesState &&
        matchesCity &&
        matchesPriceMin &&
        matchesPriceMax &&
        matchesUrgency
      );
    });
  }, [products, filters]);

  const handleViewDetails = (productId) => {
    setSelectedProductId(productId);
  };

  const handleCloseModal = () => {
    setSelectedProductId(null);
  };

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      setError(null);
      await logout();
    } catch (err) {
      setError('Logout failed');
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  
  const handleConfirmDelivery = async (productId) => {
    if (confirming[productId]) return;
    setConfirming(prev => ({ ...prev, [productId]: true }));
    try {
      const product = selectedProducts.find(p => p.productId === productId);
      const currentStatus = product.deliveryStatus;
      let newStatus;
      switch (currentStatus) {
        case DELIVERY_STATUS.ASSIGNED:
          newStatus = DELIVERY_STATUS.SHIPPED;
          break;
        case DELIVERY_STATUS.SHIPPED:
          newStatus = DELIVERY_STATUS.TRAVELER_CONFIRMED;
          break;
        case DELIVERY_STATUS.CLIENT_CONFIRMED:
          newStatus = DELIVERY_STATUS.COMPLETE;
          break;
        default:
          throw new Error('Invalid status transition');
      }
      await updateDeliveryStatus(productId, newStatus);
      setSelectedProducts(prev =>
        prev.map(p =>
          p.productId === productId
            ? { ...p, deliveryStatus: newStatus, isDelivered: newStatus === 'delivered' }
            : p
        )
      );
      console.log(`Traveler ${userId} confirmed delivery for ${productId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(prev => ({ ...prev, [productId]: false }));
    }
  };

 const handleUploadProof = async (productId) => {
  const photos = productPhotos[productId];
  
  if (uploading[productId]) return;
  
  if (!photos || !Array.isArray(photos) || photos.length === 0) {
    setUploadError('Please select at least one photo before uploading.');
    return;
  }

  const photo = photos[0];
  if (!photo?.base64 || !photo?.type || !photo?.size) {
    setUploadError('Invalid photo data. Please try uploading again.');
    return;
  }
  
  setUploading(prev => ({ ...prev, [productId]: true }));
  setUploadError(null);
  
  try {
    console.log('Uploading photo for product:', productId, {
      type: photo.type,
      size: photo.size,
      hasBase64: !!photo.base64
    });
    
    const response = await uploadDeliveryProof(productId, {
      base64: photo.base64,
      type: photo.type,
      size: photo.size
    });

    console.log('Upload response:', response);
    alert('Proof uploaded successfully!');
    setProductPhotos(prev => ({ ...prev, [productId]: [] }));
    
    const product = selectedProducts.find(p => p.productId === productId);
    if (product.deliveryStatus === DELIVERY_STATUS.CLIENT_CONFIRMED) {
      await updateDeliveryStatus(productId, DELIVERY_STATUS.COMPLETE);
      setSelectedProducts(prev =>
        prev.map(p =>
          p.productId === productId
            ? { ...p, deliveryStatus: DELIVERY_STATUS.COMPLETE, isDelivered: true }
            : p
        )
      );
    }
  } catch (err) {
    console.error('Upload error:', err);
    setUploadError(err.message || 'Failed to upload proof. Please try again.');
  } finally {
    setUploading(prev => ({ ...prev, [productId]: false }));
  }
};
  const handleRateClient = (productId) => {
    navigate(`/rate-product/${productId}`, { state: { isTraveler: true } });
  };

  // Split products into two rows
  const half = Math.ceil(filteredProducts.length / 2);
  const topRowProducts = filteredProducts.slice(0, half);
  const bottomRowProducts = filteredProducts.slice(half);

  // Split selected products into two rows
  const selectedHalf = Math.ceil(selectedProducts.length / 2);
  const topRowSelectedProducts = selectedProducts.slice(0, selectedHalf);
  const bottomRowSelectedProducts = selectedProducts.slice(selectedHalf);

  // Early returns after hooks
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 min-w-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-600">Products for Fulfillment</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-md text-sm hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Logout
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-wrap md:flex-wrap lg:flex-row gap-4">
          <div className="flex flex-col w-full sm:w-auto md:min-w-[140px] lg:min-w-[120px]">
            <label className="block text-blue-600 text-sm sm:text-base">Categories</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="mt-2 px-1 py-0 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-auto md:min-w-[140px] lg:min-w-[120px] h-[30px]"
            >
              {categories.map((categoryName) => (
                <option key={categoryName} value={categoryName}>
                  {categoryName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 w-full sm:w-auto md:min-w-[140px] lg:min-w-[120px]">
            <CountryStateCityComponent
              selectedCountry={country}
              setSelectedCountry={setCountry}
              selectedState={state}
              setSelectedState={setState}
              selectedCity={city}
              setSelectedCity={setCity}
            />
          </div>

          <input
            type="number"
            placeholder="Min Price"
            value={filters.priceMin}
            onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
            className="mt-6 px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-auto md:min-w-[140px] lg:min-w-[120px] h-[40px]"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={filters.priceMax}
            onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
            className="px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-auto md:min-w-[140px] lg:min-w-[120px] h-[40px]"
          />
          <select
            value={filters.urgency}
            onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
            className="px-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-auto md:min-w-[140px] lg:min-w-[120px] h-[40px]"
          >
            <option value="">Urgency</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* Available Products - Two Rows */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-blue-600 mb-4">Available Products</h2>
          {loading ? (
            <p className="text-gray-600">Loading products...</p>
          ) : error ? (
            <p className="text-red-600">Error: {error}</p>
          ) : products.length === 0 ? (
            <p className="text-gray-600">No products available.</p>
          ) : (
            <div className="space-y-6">
              {/* Top Row */}
              <div className="flex overflow-x-auto space-x-4 pb-4">
                {topRowProducts.map(product => (
                  <div
                    key={product.productId}
                    className="flex-shrink-0 w-64 bg-gray-50 p-4 rounded-md border shadow-sm"
                  >
                    {product.productPhotos && product.productPhotos.length > 0 ? (
                      <img
                        src={product.productPhotos[0]}
                        alt={product.productName}
                        className="w-full h-32 object-cover rounded-md mb-2"
                      />
                    ) : null}
                    <p className="font-medium text-gray-700">{product.productName}</p>
                    <p className="text-sm text-gray-600">{`${product.destination.country}, ${product.destination.state}, ${product.destination.city}`}</p>
                    <p className="text-sm text-gray-600">Reward: KES {product.rewardAmount}</p>
                    <p className="text-sm text-gray-600">Urgency: {product.urgencyLevel}</p>
                    <p className="text-sm text-gray-600">Price: KES {product.productPrice}</p>
                    <button
                      onClick={() => handleViewDetails(product.productId)}
                      className="mt-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>

              {/* Bottom Row */}
              <div className="flex overflow-x-auto space-x-4 pb-4">
                {bottomRowProducts.map(product => (
                  <div
                    key={product.productId}
                    className="flex-shrink-0 w-64 bg-gray-50 p-4 rounded-md border shadow-sm"
                  >
                    {product.productPhotos && product.productPhotos.length > 0 ? (
                      <img
                        src={product.productPhotos[0]}
                        alt={product.productName}
                        className="w-full h-32 object-cover rounded-md mb-2"
                      />
                    ) : null}
                    <p className="font-medium text-gray-700">{product.productName}</p>
                    <p className="text-sm text-gray-600">{`${product.destination.country}, ${product.destination.state}, ${product.destination.city}`}</p>
                    <p className="text-sm text-gray-600">Reward: KES {product.rewardAmount}</p>
                    <p className="text-sm text-gray-600">Urgency: {product.urgencyLevel}</p>
                    <p className="text-sm text-gray-600">Price: KES {product.productPrice}</p>
                    <button
                      onClick={() => handleViewDetails(product.productId)}
                      className="mt-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Products Selected for Delivery - Two Rows */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-blue-600 mb-4">Products Selected for Delivery</h2>
          {loading ? (
            <p className="text-gray-600">Loading selected products...</p>
          ) : error ? (
            <p className="text-red-600">Error: {error}</p>
          ) : selectedProducts.length === 0 ? (
            <p className="text-gray-600">No products selected for delivery.</p>
          ) : (
            <div className="space-y-6">
              {/* Top Row */}
              <div className="flex overflow-x-auto space-x-4 pb-4">
                {topRowSelectedProducts.map(product => (
                  <div
                    key={product.productId}
                    className="flex-shrink-0 w-64 bg-gray-50 p-4 rounded-md border shadow-sm"
                  >
                    {product.productPhotos && product.productPhotos.length > 0 ? (
                      <img
                        src={product.productPhotos[0]}
                        alt={product.productName}
                        className="w-full h-32 object-cover rounded-md mb-2"
                      />
                    ) : null}
                    <p className="font-medium text-gray-700">{product.productName}</p>
                    <p className="text-sm text-gray-600">{`${product.destination.country}, ${product.destination.state}, ${product.destination.city}`}</p>
                    <p className="text-sm text-gray-600">Reward: KES {product.rewardAmount}</p>
                    <p className="text-sm text-gray-600">Urgency: {product.urgencyLevel}</p>
                    <p className="text-sm text-gray-600">Price: KES {product.productPrice}</p>
                    <p className="text-sm text-gray-600">Status: {product.isDelivered ? 'Delivered' : product.deliveryStatus}</p>
                    {[DELIVERY_STATUS.ASSIGNED, DELIVERY_STATUS.SHIPPED].includes(product.deliveryStatus) && (
                      <button
                        onClick={() => handleConfirmDelivery(product.productId)}
                        className="mt-2 w-full bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                        disabled={confirming[product.productId]}
                      >
                        {confirming[product.productId] ? 'Updating...' : product.deliveryStatus === DELIVERY_STATUS.ASSIGNED ? 'Mark as Shipped' : 'Mark as Traveler Confirmed'}
                      </button>
                    )}
                    {product.deliveryStatus === DELIVERY_STATUS.TRAVELER_CONFIRMED && (
                      <button
                        disabled
                        className="mt-2 w-full bg-gray-400 text-white px-3 py-1 rounded cursor-not-allowed text-sm"
                      >
                        Awaiting Client Confirmation
                      </button>
                    )}
                    {product.deliveryStatus === DELIVERY_STATUS.CLIENT_CONFIRMED && (
                      <>
                        <PhotoUpload
                          photos={productPhotos[product.productId] || []}
                            setPhotos={(newPhotosOrFunction) => {
                              console.log('TravelerDashboard: Setting photos for product:', product.productId);
                              
                              if (typeof newPhotosOrFunction === 'function') {
                                // If PhotoUpload passes a function, handle it
                                setProductPhotos(prev => ({ 
                                  ...prev, 
                                  [product.productId]: newPhotosOrFunction(prev[product.productId] || [])
                                }));
                              } else {
                                // If PhotoUpload passes the actual array, use it directly
                                setProductPhotos(prev => ({ 
                                  ...prev, 
                                  [product.productId]: newPhotosOrFunction
                                }));
                              }
                            }}
                          className="w-full mt-2 px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        {uploadError && <p className="text-red-600 mt-2 text-sm">{uploadError}</p>}
                        <button
                          onClick={() => handleUploadProof(product.productId)}
                          className="mt-2 w-full bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                          disabled={
                            uploading[product.productId] || 
                            !productPhotos[product.productId] || 
                            !Array.isArray(productPhotos[product.productId]) ||
                            productPhotos[product.productId].length === 0 ||
                            productPhotos[product.productId].some((photo) => !photo?.base64 || !photo?.type || !photo?.size) }
                        >
                          {uploading[product.productId] ? 'Uploading...' : 'Upload Proof'}
                        </button>
                        <button
                          onClick={() => handleRateClient(product.productId)}
                          className="mt-2 w-full bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                        >
                          Rate Client
                        </button>
                      </>
                    )}
                    {(product.deliveryStatus === DELIVERY_STATUS.CLIENT_CONFIRMED || 
                      product.deliveryStatus === DELIVERY_STATUS.DELIVERED) && (
                      <p className="mt-2 text-green-600 font-medium text-center text-sm">
                        Awaiting Proof Upload
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom Row */}
              <div className="flex overflow-x-auto space-x-4 pb-4">
                {bottomRowSelectedProducts.map(product => (
                  <div
                    key={product.productId}
                    className="flex-shrink-0 w-64 bg-gray-50 p-4 rounded-md border shadow-sm"
                  >
                    {product.productPhotos && product.productPhotos.length > 0 ? (
                      <img
                        src={product.productPhotos[0]}
                        alt={product.productName}
                        className="w-full h-32 object-cover rounded-md mb-2"
                      />
                    ) : null}
                    <p className="font-medium text-gray-700">{product.productName}</p>
                    <p className="text-sm text-gray-600">{`${product.destination.country}, ${product.destination.state}, ${product.destination.city}`}</p>
                    <p className="text-sm text-gray-600">Reward: KES {product.rewardAmount}</p>
                    <p className="text-sm text-gray-600">Urgency: {product.urgencyLevel}</p>
                    <p className="text-sm text-gray-600">Price: KES {product.productPrice}</p>
                    <p className="text-sm text-gray-600">Status: {product.isDelivered ? 'Delivered' : product.deliveryStatus}</p>
                    {[DELIVERY_STATUS.ASSIGNED, DELIVERY_STATUS.SHIPPED].includes(product.deliveryStatus) && (
                      <button
                        onClick={() => handleConfirmDelivery(product.productId)}
                        className="mt-2 w-full bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                        disabled={confirming[product.productId]}
                      >
                        {confirming[product.productId] ? 'Updating...' : product.deliveryStatus === DELIVERY_STATUS.ASSIGNED ? 'Mark as Shipped' : 'Mark as Traveler Confirmed'}
                      </button>
                    )}
                    {product.deliveryStatus === DELIVERY_STATUS.TRAVELER_CONFIRMED && (
                      <button
                        disabled
                        className="mt-2 w-full bg-gray-400 text-white px-3 py-1 rounded cursor-not-allowed text-sm"
                      >
                        Awaiting Client Confirmation
                      </button>
                    )}
                    {product.deliveryStatus === DELIVERY_STATUS.CLIENT_CONFIRMED && (
                      <>
                        <PhotoUpload
                           photos={productPhotos[product.productId] || []}
                            setPhotos={(newPhotosOrFunction) => {
                              console.log('TravelerDashboard: Setting photos for product:', product.productId);
                              
                              if (typeof newPhotosOrFunction === 'function') {
                                // If PhotoUpload passes a function, handle it
                                setProductPhotos(prev => ({ 
                                  ...prev, 
                                  [product.productId]: newPhotosOrFunction(prev[product.productId] || [])
                                }));
                              } else {
                                // If PhotoUpload passes the actual array, use it directly
                                setProductPhotos(prev => ({ 
                                  ...prev, 
                                  [product.productId]: newPhotosOrFunction
                                }));
                              }
                            }}
                          className="w-full mt-2 px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          productId={product.productId}
                        />
                        {uploadError && <p className="text-red-600 mt-2 text-sm">{uploadError}</p>}
                        <button
                          onClick={() => handleUploadProof(product.productId)}
                          className="mt-2 w-full bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                          disabled={
                            uploading[product.productId] ||
                            !productPhotos[product.productId] ||
                            !Array.isArray(productPhotos[product.productId]) ||
                            productPhotos[product.productId].length === 0 ||
                            productPhotos[product.productId].some((photo) => !photo?.base64 || !photo?.type || !photo?.size)
                          }
                        >
                          {uploading[product.productId] ? 'Uploading...' : 'Upload Proof'}
                        </button>
                        <button
                          onClick={() => handleRateClient(product.productId)}
                          className="mt-2 w-full bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                        >
                          Rate Client
                        </button>
                      </>
                    )}
                    {(product.deliveryStatus === DELIVERY_STATUS.CLIENT_CONFIRMED || 
                      product.deliveryStatus === DELIVERY_STATUS.DELIVERED) && (
                      <p className="mt-2 text-green-600 font-medium text-center text-sm">
                        Awaiting Proof Upload
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Total Earnings Overview */}
        <div className="bg-white rounded-xl shadow-md p-6 sm:pb-96 md:pb-20">
          <div className="flex items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-600">Total Earnings Overview</h2>
            <select
              value={period}
              onChange={handlePeriodChange}
              className="ml-4 px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          {loading ? (
            <p className="text-gray-600">Loading earnings...</p>
          ) : error ? (
            <p className="text-red-600">Error: {error}</p>
          ) : (
            <>
              <p className="text-gray-700 mb-4">Total Earnings: KES {earnings.totalEarnings}</p>
              <h3 className="text-lg font-medium text-blue-600 mb-2">Pending Escrow Amount</h3>
              <p className="text-gray-700 mb-4">Pending Escrow Amount: KES {earnings.pendingPayments}</p>
              <h3 className="text-lg font-medium text-blue-600 mb-2">Traveler Ratings</h3>
              <p className="text-gray-700 mb-4">Rating: {earnings.rating.average.toFixed(1)} ({earnings.rating.count} reviews)</p>
              <button
                onClick={() => navigate('/traveler-history')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              >
                View Account History
              </button>
            </>
          )}
        </div>
      </div>

      {/* UserProfile */}
      <UserProfile userId={userId} />

      {/* Product Details Modal */}
      {selectedProductId && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 z-50">
          <ProductDetails productId={selectedProductId} onClose={handleCloseModal} travelerId={userId} />
        </div>
      )}
    </div>
  );
};

export default TravelerDashboard;