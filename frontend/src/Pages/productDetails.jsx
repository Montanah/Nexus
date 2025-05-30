import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../Context/AuthContext';
import PropTypes from 'prop-types';
import { getProductDetails, assignFulfillment } from '../Services/api';

const ProductDetails = ({ productId, onClose }) => {
  const { userId } = useAuth();
  const [product, setProduct] = useState(null);
  const [isAccepted, setIsAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(false);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      console.log('Fetching product for productId:', productId);
      const productData = await getProductDetails(productId);
      if (!productData) throw new Error('Product not found');
      return productData;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct().then(productData => {
      if (productData) {
        setProduct(productData);
        setIsAccepted(productData.assignedTraveler === userId);
      }
    });
  }, [productId, userId]);

  const handleAcceptFulfillment = async () => {
    if (accepting) return;
    setAccepting(true);
    try {
      const updatedProduct = await assignFulfillment(productId);
      console.log('Updated product:', updatedProduct);
      setIsAccepted(true);
      setProduct(updatedProduct);
      console.log(`Traveler ${userId} accepted fulfillment for ${productId}`, updatedProduct);
      // Removed onClose() to keep the modal open
    } catch (err) {
      setError(`Failed to accept fulfillment: ${err.message}`);
      console.error('Acceptance error:', err);
    } finally {
      setAccepting(false);
    }
  };

  const memoizedProduct = useMemo(() => product, [product]);

  if (loading) {
    return (
      <div className="w-full sm:w-96 max-w-md bg-white rounded-xl shadow-md p-6 text-gray-600 text-center">
        Loading...
      </div>
    );
  }

  if (error || !memoizedProduct) {
    return (
      <div className="w-full sm:w-96 max-w-md bg-white rounded-xl shadow-md p-6 text-red-600 text-center">
        {error || 'Product not found.'}
      </div>
    );
  }

  return (
    <div className="w-full sm:w-96 max-w-md bg-white rounded-xl shadow-md p-6 relative max-h-[80vh] overflow-y-auto">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 text-sm sm:text-lg"
      >
        ✕
      </button>
      <h1 className="text-2xl text-sm sm:text-2xl font-bold text-blue-600 mb-4 text-center">Product Details</h1>
      {memoizedProduct.productPhotos && memoizedProduct.productPhotos.length > 0 && (
        <img
          src={memoizedProduct.productPhotos[0]}
          alt={memoizedProduct.productName}
          className="w-full h-48 object-cover rounded-md mb-4"
        />
      )}
      <div className="space-y-2">
        <p className="text-lg text-sm sm:text-lg font-medium text-gray-700">{memoizedProduct.productName}</p>
        {memoizedProduct.productDescription && (
          <p className="text-gray-600 text-sm sm:text-base"><span className="font-medium">Description:</span> {memoizedProduct.productDescription}</p>
        )}
        <p className="text-gray-600 text-sm sm:text-base"><span className="font-medium">Quantity:</span> {memoizedProduct.quantity}</p>
        {memoizedProduct.dimensions && (
          <p className="text-gray-600 text-sm sm:text-base"><span className="font-medium">Dimensions:</span> {memoizedProduct.dimensions}</p>
        )}
        {memoizedProduct.shippingRestrictions && (
          <p className="text-gray-600 text-sm sm:text-base"><span className="font-medium">Shipping Restrictions:</span> {memoizedProduct.shippingRestrictions}</p>
        )}
        <p className="text-gray-600 text-sm sm:text-base"><span className="font-medium">Destination:</span> {`${memoizedProduct.destination.country}, ${memoizedProduct.destination.city}`}</p>
        <p className="text-gray-600 text-sm sm:text-base"><span className="font-medium">Reward:</span> KES {memoizedProduct.rewardAmount}</p>
        <p className="text-gray-600 text-sm sm:text-base"><span className="font-medium">Urgency:</span> {memoizedProduct.urgencyLevel}</p>
        <p className="text-gray-600 text-sm sm:text-base"><span className="font-medium">Price:</span> KES {memoizedProduct.productPrice}</p>
        <p className="text-gray-600 text-sm sm:text-base"><span className="font-medium">Delivery Status:</span> {memoizedProduct.isDelivered ? 'Delivered' : memoizedProduct.deliveryStatus}</p>
      </div>

      {!isAccepted && memoizedProduct.claimedBy === null && (
        <button
          onClick={handleAcceptFulfillment}
          className="mt-4 w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 text-sm sm:text-base"
          disabled={accepting}
        >
          {accepting ? 'Accepting...' : 'Deliver Product'}
        </button>
      )}

      {memoizedProduct.assignedTraveler && !isAccepted && (
        <p className="mt-4 text-gray-600 text-center text-sm sm:text-sm">Already assigned to another traveler.</p>
      )}
      {isAccepted && (
        <p className="mt-4 text-green-600 text-center text-sm sm:text-sm">You have accepted this product for delivery. Check the &quot;Products Selected for Delivery&quot; section.</p>
      )}
      {error && <p className="mt-4 text-red-600 text-center text-sm sm:text-sm">{error}</p>}
    </div>
  );
};

ProductDetails.propTypes = {
  productId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  travelerId: PropTypes.string.isRequired,
};

export default ProductDetails;