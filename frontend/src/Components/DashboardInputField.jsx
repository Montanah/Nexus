import PropTypes from 'prop-types';

const DashboardInputField = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  options,
  required,
  disabled,
  rows = 1,
  className,
}) => (
  <div className="flex flex-col">
    {label && <label className="block mb-2 text-blue-600">{label}</label>}
    {options ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className || "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"}
        required={required}
        disabled={disabled}
      >
        <option value="">Select an option</option> {/* Add default empty option */}
        {options.map((option) => (
          <option
            key={typeof option === 'object' ? option.value : option} // Use value or string as key
            value={typeof option === 'object' ? option.value : option} // Use value or string as value
          >
            {typeof option === 'object' ? option.label : option} 
          </option>
        ))}
      </select>
    ) : rows > 1 ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className || "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"}
        rows={rows}
        required={required}
        disabled={disabled}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className || "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"}
        required={required}
        disabled={disabled}
      />
    )}
  </div>
);

DashboardInputField.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      }),
    ])
  ),
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  rows: PropTypes.number,
  className: PropTypes.string,
};

export default DashboardInputField;