import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { api } from '../Services/api';

const RatingForm = () => {
  const { userId } = useAuth();
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isTraveler, setIsTraveler] = useState(false); // Simplified; determine role from context

  const handleSubmit = async () => {
    const endpoint = isTraveler ? '/api/ratings/traveler-to-client' : '/api/ratings/client-to-traveler';
    const data = {
      orderNumber,
      userId: isTraveler ? null : userId,
      travelerId: isTraveler ? userId : null,
      rating,
      comment
    };
    await api.post(endpoint, data);
    navigate(isTraveler ? '/traveler-dashboard' : '/orders');
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
          className="w-full mb-4 px-3 py-2 border rounded-md"
        />
        <label className="block mb-2 text-blue-600">Comment (Optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded-md"
        />
        <button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded">Submit Rating</button>
      </div>
    </div>
  );
};

export default RatingForm;