import { useState } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { rateClient, rateTraveler } from '../Services/api';

const RatingForm = ({ isTraveler }) => {
  const { userId } = useAuth();
  const { productId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    try {
      const data = {
        productId,
        userId,
        rating,
        comment,
      };

      if (isTraveler) {
        await rateClient(data); // Traveler rates client
        navigate('/traveler-dashboard');
      } else {
        await rateTraveler(data); // Client rates traveler
        navigate('/orders');
      }
      setError(null);
    } catch (error) {
      console.error('Error submitting rating:', error);
      setError('Failed to submit rating. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 flex items-center justify-center p-6">
      <div className="w-96 bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-blue-600 mb-4 text-center">
          Rate {isTraveler ? 'Client' : 'Traveler'} for Product #{productId}
        </h1>
        {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
        <label className="block mb-2 text-blue-600">Rating (1-5)</label>
        <input
          type="number"
          min="1"
          max="5"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-full mb-4 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label className="block mb-2 text-blue-600">Comment (Optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit Rating
        </button>
      </div>
    </div>
  );
};
RatingForm.propTypes = {
  isTraveler: PropTypes.bool.isRequired,
};

export default RatingForm;