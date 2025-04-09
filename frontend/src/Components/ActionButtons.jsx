import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const ActionButtons = ({ onCheckout, onSave }) => {
  const navigate = useNavigate();

  const handleCheckout = async () => {
    await onCheckout();
    navigate('/checkout');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await onSave(e);
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
        type="submit"
        onClick={handleSave}
        className="w-full md:w-auto flex-1 bg-indigo-500 text-white px-3 py-1 sm:px-3 sm:py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 hover:bg-indigo-600 text-sm sm:text-base"
      >
        Add More
      </button>
    </div>
  );
};
ActionButtons.propTypes = {
  onCheckout: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default ActionButtons;