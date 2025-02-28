import { useNavigate } from 'react-router-dom';

const ActionButtons = ({ onCheckout, onAddToCart, onSave }) => {
  const navigate = useNavigate();

  const handleCheckout = async () => {
    await onCheckout(); // Trigger POST in ClientDashboard
    navigate('/checkout-success'); // Redirect after success
  };

  const handleAddToCart = async () => {
    await onAddToCart(); // Trigger POST in ClientDashboard
  };

  const handleSave = async (e) => {
    e.preventDefault(); // Prevent form submission if not desired
    await onSave(e); // Trigger POST in ClientDashboard
  };

  return (
    <div className="block mb-2 space-x-20">
      <button
        type="button"
        onClick={handleCheckout}
        className="flex-1 bg-green-500 text-white px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 hover:bg-green-600 text-sm"
      >
        Checkout
      </button>
      <button
        type="button"
        onClick={handleAddToCart}
        className="flex-1 bg-blue-500 text-white px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-blue-600 text-sm"
      >
        Add to Cart
      </button>
      <button
        type="submit"
        onClick={handleSave}
        className="flex-1 bg-indigo-500 text-white px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 hover:bg-indigo-600 text-sm"
      >
        Save
      </button>
    </div>
  );
};

export default ActionButtons;