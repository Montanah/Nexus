const InputField = ({
    type,
    name,
    placeholder,
    value,
    onChange,
    error,
    showToggle,
    toggleVisibility,
    showPassword,
  }) => (
    <div className="relative">
      <input
        type={showToggle ? (showPassword ? 'text' : 'password') : type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          error ? 'border-red-500' : ''
        }`}
      />
      {showToggle && (
        <button
          type="button"
          onClick={toggleVisibility}
          className="absolute right-3 top-3 text-gray-500"
        >
          {showPassword ? '👁️' : '🙈'}
        </button>
      )}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
  
  export default InputField;