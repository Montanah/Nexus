import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { rateClient, rateTraveler, fetchUser} from '../Services/api';

const RatingForm = () => {
  const { userId } = useAuth();
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isTraveler, setIsTraveler] = useState(false);

  useEffect(() => {
    const fetchRole = async () => {
      const response = await fetchUser(userId);
      setIsTraveler(response.data.role === 'traveler');
    };
    fetchRole();
  }, [userId]);

  const handleSubmit = async () => {
    try {
      const data = {
        orderNumber,
        userId: isTraveler ? null : userId, // Client ID if rating traveler
        travelerId: isTraveler ? userId : null, // Traveler ID if rating client
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
    } catch (error) {
      console.error('Error submitting rating:', error);
      // Optionally, show an error message to the user
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 p-6">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">Rate Order #{orderNumber}</h1>
      <div className="bg-white rounded-xl shadow-md p-6">
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
        />
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit Rating
        </button>
      </div>
    </div>
  );
};

export default RatingForm;