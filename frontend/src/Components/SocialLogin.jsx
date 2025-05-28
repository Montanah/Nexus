import SocialButton from './SocialButton';

const SocialLogin = ({ onSocialSignup, loading, error, loginRole }) => (
  <div className="mt-6 space-y-4">
    <div className="flex items-center justify-center">
      <div className="border-t border-gray-300 grow mr-3"></div>
      <span className="text-gray-500">or continue with</span>
      <div className="border-t border-gray-300 grow ml-3"></div>
    </div>
    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
    <div className="flex space-x-4 justify-center">
      <SocialButton
        platform="google"
        onClick={() => onSocialSignup('google', loginRole)}
        loading={loading} // Pass the object
        iconSrc="https://www.svgrepo.com/show/303108/google-icon-logo.svg"
        label="Google"
      />
      <SocialButton
        platform="apple"
        onClick={() => onSocialSignup('apple', loginRole)}
        loading={loading} // Pass the object
        iconSrc="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
        label="Apple"
      />
    </div>
  </div>
);

export default SocialLogin;