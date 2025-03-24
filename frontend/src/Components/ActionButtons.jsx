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
    <div className="flex flex-col md:flex-row gap-4 md:gap-6">
      <button
        type="button"
        onClick={handleCheckout}
        className="w-full md:w-auto flex-1 bg-green-500 text-white px-3 py-1 sm:px-3 sm:py-1 rounded-md focus:outline-none focus:ring-green-400 hover:bg-green-600 text-sm sm:text-base"
      >
        Checkout
      </button>
      <button
        type="button"
        onClick={handleAddToCart}
        className="w-full md:w-auto flex-1 bg-blue-500 text-white px-3 py-1 sm:px-3 sm:py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-blue-600 text-sm sm:text-base leading-tight"
      >
        Add to Cart
      </button>
      <button
        type="submit"
        onClick={handleSave}
        className="w-full md:w-auto flex-1 bg-indigo-500 text-white px-3 py-1 sm:px-3 sm:py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 hover:bg-indigo-600 text-sm sm:text-base"
      >
        Save
      </button>
    </div>
  );
};

export default ActionButtons;