import { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import PhotoUpload from '../Components/PhotoUpload';
import {getProductDetails, assignFulfillment, uploadProof} from '../Services/api';

const ProductDetails = ({ productId, onClose}) => {

  const { userId } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [productPhotos, setProductPhotos] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const [isAccepted, setIsAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch product details using apiService
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productData = await getProductDetails(productId);
        setProduct(productData);
        setIsAccepted(productData.assignedTraveler === userId);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, userId]);

  const handleAcceptFulfillment = async () => {
    try {
      const updatedProduct = await assignFulfillment(productId, userId);
      setIsAccepted(true);
      setProduct(updatedProduct); // Update local state with API response
      console.log(`Traveler ${userId} accepted fulfillment for ${productId}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUploadProof = async () => {
    if (productPhotos.length === 0) {
      setUploadError('No photos selected.');
      return;
    }
    try {
      const formData = new FormData();
      productPhotos.forEach(photo => formData.append('photos', photo));
      const response = await uploadProof(productId, userId, formData);
      if (!response.ok) throw new Error('Failed to upload proof');
      console.log('Proof uploaded:', { productId, userId, photos: productPhotos });
      setUploadError(null);
      alert('Proof uploaded successfully!');
      setProductPhotos([]);
    } catch (err) {
      setUploadError(err.message);
    }
  };

  const handleRateClient = () => {
    navigate(`/rate-product/${productId}`, { state: { isTraveler: true } });
    onClose();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-4 sm:pt-20 overflow-y-auto">
        <div className="w-full sm:w-96 bg-white rounded-xl shadow-md p-6 text-gray-600 text-center">
          Loading...
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-4 sm:pt-20 overflow-y-auto">
        <div className="w-full sm:w-96 bg-white rounded-xl shadow-md p-6 text-red-600 text-center">
          {error || 'Product not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-4 sm:pt-20 overflow-y-auto">
      <div className="w-full sm:w-96 bg-white rounded-xl shadow-md p-6 relative max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
        >
          ✕
        </button>
        <h1 className="text-2xl font-bold text-blue-600 mb-4 text-center">Product #{productId}</h1>
        {product.productPhotos && product.productPhotos.length > 0 && (
          <img
            src={product.productPhotos[0]}
            alt={product.productName}
            className="w-full h-48 object-cover rounded-md mb-4"
          />
        )}
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-700">{product.productName}</p>
          {product.productDescription && (
            <p className="text-gray-600"><span className="font-medium">Description:</span> {product.productDescription}</p>
          )}
          <p className="text-gray-600"><span className="font-medium">Quantity:</span> {product.quantity}</p>
          {product.dimensions && (
            <p className="text-gray-600"><span className="font-medium">Dimensions:</span> {product.dimensions}</p>
          )}
          {product.shippingRestrictions && (
            <p className="text-gray-600"><span className="font-medium">Shipping Restrictions:</span> {product.shippingRestrictions}</p>
          )}
          <p className="text-gray-600"><span className="font-medium">Destination:</span> {`${product.delivery.country}, ${product.delivery.city}`}</p>
          <p className="text-gray-600"><span className="font-medium">Reward:</span> ${product.rewardAmount}</p>
          <p className="text-gray-600"><span className="font-medium">Urgency:</span> {product.urgencyLevel}</p>
          <p className="text-gray-600"><span className="font-medium">Price:</span> ${product.productPrice}</p>
        </div>

        {!isAccepted && product.assignedTraveler === null && (
          <button
            onClick={handleAcceptFulfillment}
            className="mt-4 w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            Deliver Product
          </button>
        )}

        {isAccepted && (
          <>
            <PhotoUpload
              photos={productPhotos}
              setPhotos={setProductPhotos}
              className="w-full mt-4 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            {uploadError && <p className="text-red-600 mt-2">{uploadError}</p>}
            <button
              onClick={handleUploadProof}
              className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              disabled={productPhotos.length === 0}
            >
              Upload Proof
            </button>
            <button
              onClick={handleRateClient}
              className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Rate Client
            </button>
          </>
        )}

        {product.assignedTraveler && !isAccepted && (
          <p className="mt-4 text-gray-600 text-center">Already assigned to another traveler.</p>
        )}
      </div>
    </div>
  );
};
ProductDetails.propTypes = {
  productId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ProductDetails;