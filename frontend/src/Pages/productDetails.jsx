import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// import { useAuth } from '../Context/AuthContext';
import { getProductDetails } from '../Services/api'; 

const ProductDetails = () => {
  // const { userId } = useAuth();
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await getProductDetails(productId);
        setProduct(response.data.product);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product details:', error);
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleRateProduct = () => {
    navigate(`/rate-product/${productId}`, { state: { isTraveler: true } });
  };

  if (loading) {
    return <div className="text-blue-600">Loading...</div>;
  }

  if (!product) {
    return <div className="text-red-600">Product not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 p-6">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">Product #{productId}</h1>
      <div className="bg-white rounded-xl shadow-md p-6">
        {product.productPhotos && product.productPhotos.length > 0 && (
          <img
            src={product.productPhotos[0]}
            alt={product.productName}
            className="w-full h-48 object-cover rounded-md mb-4"
          />
        )}
        <p className="text-lg font-medium text-gray-700">{product.productName}</p>
        <p className="text-gray-600">Destination: {`${product.delivery.country}, ${product.delivery.city}`}</p>
        <p className="text-gray-600">Reward: ${product.rewardAmount}</p>
        <p className="text-gray-600">Urgency: {product.urgencyLevel}</p>
        <p className="text-gray-600">Price: ${product.productPrice}</p>
        <button
          onClick={handleRateProduct}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Rate Product
        </button>
      </div>
    </div>
  );
};

export default ProductDetails;