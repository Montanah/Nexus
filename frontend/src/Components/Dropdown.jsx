import PropTypes from 'prop-types';

const Dropdown = ({ options, value, onChange, disabled }) => (
  <select
    value={value}
    onChange={onChange}
    disabled={disabled}
    className="w-full md:w-48 px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base disabled:bg-gray-100"
  >
    <option value="">Select an option</option>
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.displayValue}
      </option>
    ))}
  </select>
);

Dropdown.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      displayValue: PropTypes.string.isRequired,
    })
  ).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default Dropdown;