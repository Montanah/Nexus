import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Components/SideBar';
import UserProfile from '../Components/UserProfile';
import ProductDetails from './productDetails';
import CountryStateCityComponent from '../Components/State';
import { getAvailableProducts, getCategories, getTravelerEarnings } from '../Services/api';

const TravelerDashboard = () => {
  const navigate = useNavigate();
  const { userId, logout, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    category: 'All',
    country: '',
    state: '',
    city: '',
    priceMin: '',
    priceMax: '',
    urgency: '',
  });
  const [earnings, setEarnings] = useState({
    totalEarnings: '0.00',
    pendingPayments: '0.00',
    rating: { average: 0, count: 0 },
  });
  const [period, setPeriod] = useState('all');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [categories, setCategories] = useState(['All']);
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data using api service
  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) {
        return;
      }
      if (!userId) {
        navigate('/login');
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const [productsData, categoriesData, earningsData] = await Promise.all([
          getAvailableProducts(),
          getCategories(),
          getTravelerEarnings(userId),
        ]);

        const mappedProducts = productsData.flatMap(order => {
          if (!order.items || !Array.isArray(order.items)) return [];
          return order.items.map(item => ({
            productId: item.product?._id || `PRODUCT_${order.orderNumber}`,
            productName: item.product?.productName || 'Unnamed Product',
            destination: {
              country: item.product?.destination?.country || '',
              city: item.product?.destination?.city || '',
              state: item.product?.destination?.state || '',
            },
            deliveryDate: item.product?.deliverydate || '',
            productPrice: parseFloat(item.product?.totalPrice) || 0,
            rewardAmount: parseFloat(item.product?.productMarkup) || 0,
            urgencyLevel: item.product?.urgencyLevel || 'low',
            productPhotos: item.product?.productPhotos || [],
            categoryName: item.product?.categoryName || 'Uncategorized',
          }));
        });

        setProducts(mappedProducts);
        const categoryList = Array.isArray(categoriesData)
          ? ['All', ...categoriesData.map(cat => cat.categoryName)]
          : ['All'];
        setCategories(categoryList);
        setEarnings(earningsData);
      } catch (err) {
        console.error('Fetch data error:', err);
        if (err.response?.status === 401) {
          console.log('Unauthorized, navigating to login');
          navigate('/login');
        } else if (err.response?.status === 404) {
          setError('Product service unavailable. Please try again later.');
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

  // Split products into two rows
  const half = Math.ceil(filteredProducts.length / 2);
  const topRowProducts = filteredProducts.slice(0, half);
  const bottomRowProducts = filteredProducts.slice(half);

  // Early returns after hooks
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <div className="lg:w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 min-w-0">
        {/* Header with Title and Logout Button */}
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
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-auto md:min-w-[140px] lg:min-w-[120px]"
          >
            {categories.map((categoryName) => (
              <option key={categoryName} value={categoryName}>
                {categoryName}
              </option>
            ))}
          </select>

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
            className="px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-auto md:min-w-[140px] lg:min-w-[120px]"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={filters.priceMax}
            onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
            className="px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-auto md:min-w-[140px] lg:min-w-[120px]"
          />
          <select
            value={filters.urgency}
            onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
            className="px-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-auto md:min-w-[140px] lg:min-w-[120px]"
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
                    <p className="text-sm text-gray-600">Reward: ${product.rewardAmount}</p>
                    <p className="text-sm text-gray-600">Urgency: ${product.urgencyLevel}</p>
                    <p className="text-sm text-gray-600">Price: ${product.productPrice}</p>
                    <button
                      onClick={() => handleViewDetails(product.productId)}
                      className="mt-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                    <p className="text-sm text-gray-600">Reward: ${product.rewardAmount}</p>
                    <p className="text-sm text-gray-600">Urgency: ${product.urgencyLevel}</p>
                    <p className="text-sm text-gray-600">Price: ${product.productPrice}</p>
                    <button
                      onClick={() => handleViewDetails(product.productId)}
                      className="mt-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Total Earnings Overview */}
        <div className="bg-white rounded-xl shadow-md p-6">
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
              <p className="text-gray-700 mb-4">Total Earnings: ${earnings.totalEarnings}</p>
              <h3 className="text-lg font-medium text-blue-600 mb-2">Pending Escrow Amount</h3>
              <p className="text-gray-700 mb-4">Pending Escrow Amount: ${earnings.pendingPayments}</p>
              <h3 className="text-lg font-medium text-blue-600 mb-2">Traveler Ratings</h3>
              <p className="text-gray-700 mb-4">Rating: {earnings.rating.average.toFixed(1)} ({earnings.rating.count} reviews)</p>
              <button
                onClick={() => navigate('/traveler-history')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                View Account History
              </button>
            </>
          )}
        </div>
      </div>

      {/* UserProfile */}
      <div className="lg:w-64 flex-shrink-0">
        <UserProfile userId={userId} />
      </div>

      {/* Product Details Modal */}
      {selectedProductId && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <ProductDetails productId={selectedProductId} onClose={handleCloseModal} travelerId={userId} />
        </div>
      )}
    </div>
  );
};

export default TravelerDashboard;