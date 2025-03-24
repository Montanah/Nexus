const SocialButton = ({ platform, onClick, loading, iconSrc, label }) => (
    <button
      onClick={() => onClick(platform)}
      className="flex items-center justify-center w-full py-2 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={loading}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <svg
            className="animate-spin h-5 w-5 mr-2 text-gray-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Logging in...
        </div>
      ) : (
        <>
          <img src={iconSrc} alt={label} className="w-6 h-6 mr-2" />
          {label}
        </>
      )}
    </button>
  );
  
  export default SocialButton;