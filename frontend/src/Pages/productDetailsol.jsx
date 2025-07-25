import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../Context/AuthContext';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import PhotoUpload from '../Components/PhotoUpload';
import { getProductDetails, assignFulfillment, uploadDeliveryProof, updateDeliveryStatus } from '../Services/api';

const DELIVERY_STATUS = {
  ASSIGNED: 'Assigned',
  SHIPPED: 'Shipped',
  TRAVELER_CONFIRMED: 'Traveler Confirmed',
  CLIENT_CONFIRMED: 'Client Confirmed',
  DELIVERED: 'Delivered',
};

const ProductDetails = ({ productId, onClose }) => {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [productPhotos, setProductPhotos] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const [isAccepted, setIsAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchProduct = async () => {
    try {
      setLoading(true);

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

      setIsAccepted(true);
      setProduct(updatedProduct);
    } catch (err) {
      setError(`Failed to accept fulfillment: ${err.message}`);
      console.error('Acceptance error:', err);
    } finally {
      setAccepting(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (confirming) return;
    setConfirming(true);
    try {
      const currentStatus = product.deliveryStatus;
      let newStatus = DELIVERY_STATUS.TRAVELER_CONFIRMED;
      if (currentStatus === DELIVERY_STATUS.CLIENT_CONFIRMED) {
        newStatus = DELIVERY_STATUS.DELIVERED;
      }
      const response = await updateDeliveryStatus(productId, newStatus);
      const updatedProduct = { ...product, deliveryStatus: newStatus, isDelivered: newStatus === DELIVERY_STATUS.DELIVERED };
      setProduct(updatedProduct);
      console.log(`Traveler ${userId} confirmed delivery for ${productId}`, response);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  const handleUploadProof = async (productId) => {
    if (uploading) return;
    if (productPhotos.length === 0) {
      setUploadError('No photos selected.');
      return;
    }

    setUploading(true);
    try {
      console.log('Uploading proof for product:', productId);
      const response = await uploadDeliveryProof(productId, productPhotos[0].file);
      console.log('Proof uploaded:', response);
      setUploadError(null);
      alert('Proof uploaded successfully!');
      setProductPhotos([]);

      if (product.deliveryStatus === DELIVERY_STATUS.CLIENT_CONFIRMED) {
        const newStatus = DELIVERY_STATUS.DELIVERED;
        await updateDeliveryStatus(orderId, newStatus);
        const updatedProduct = { ...product, deliveryStatus: newStatus, isDelivered: true };
        setProduct(updatedProduct);
      }
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      productPhotos.forEach(photo => URL.revokeObjectURL(photo.preview));
    };
  }, []);

  const handleRateClient = () => {
    navigate(`/rate-product/${productId}`, { state: { isTraveler: true } });
    onClose();
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

  const canUploadAndRate = memoizedProduct.deliveryStatus === DELIVERY_STATUS.DELIVERED;

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

      {!isAccepted && product.claimedBy === null && (
        <button
          onClick={handleAcceptFulfillment}
          className="mt-4 w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 text-sm sm:text-base"
        >
          Deliver Product
        </button>
      )}
      {[DELIVERY_STATUS.ASSIGNED, DELIVERY_STATUS.SHIPPED].includes(product.deliveryStatus) && (
        <button
          onClick={handleConfirmDelivery}
          className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm sm:text-base"
          disabled={confirming}
        >
          {confirming ? "Confirming..." : "Mark as Delivered"}
        </button>
      )}
      {product.deliveryStatus === DELIVERY_STATUS.TRAVELER_CONFIRMED && (
        <button
          disabled
          className="mt-4 w-full bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed text-sm sm:text-base"
        >
          Awaiting Client Confirmation
        </button>
      )}

      {isAccepted && memoizedProduct.deliveryStatus !== DELIVERY_STATUS.DELIVERED && (
        <button
          onClick={handleConfirmDelivery}
          className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm sm:text-base"
          disabled={confirming || memoizedProduct.deliveryStatus === DELIVERY_STATUS.TRAVELER_CONFIRMED}
        >
          {confirming
            ? 'Confirming...'
            : memoizedProduct.deliveryStatus === DELIVERY_STATUS.TRAVELER_CONFIRMED
              ? 'Awaiting Client Confirmation'
              : 'Confirm Delivery'}
        </button>
      )}

      {canUploadAndRate && (
        <>
          <PhotoUpload
            photos={productPhotos}
            setPhotos={setProductPhotos}
            className="w-full mt-4 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-sm"
          />
          {uploadError && <p className="text-red-600 mt-2 text-sm sm:text-sm">{uploadError}</p>}
          <button
            onClick={() => handleUploadProof(productId)}
            className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm sm:text-base"
            disabled={uploading || productPhotos.length === 0}
          >
            {uploading ? 'Uploading...' : 'Upload Proof'}
          </button>
          <button
            onClick={handleRateClient}
            className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm sm:text-base"
          >
            Rate Client
          </button>
        </>
      )}

      {memoizedProduct.assignedTraveler && !isAccepted && (
        <p className="mt-4 text-gray-600 text-center text-sm sm:text-sm">Already assigned to another traveler.</p>
      )}
      {error && <p className="mt-4 text-red-600 text-center text-sm sm:text-sm">{error}</p>}
    </div>
  );
};

ProductDetails.propTypes = {
  productId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ProductDetails;