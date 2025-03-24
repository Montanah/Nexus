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
        className={className || "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"} // Use className if provided
        required={required}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
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

export default DashboardInputField;