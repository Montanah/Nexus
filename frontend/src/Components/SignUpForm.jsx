import { useState } from 'react';
import InputField from './InputField';
import axios from 'axios';

const SignupForm = ({ navigate }) => {
  const baseUrl = import.meta.env.VITE_API_KEY;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '', // Changed from phonenumber
    password: '',
    verifyPassword: '',
  });

  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    phone_number: '', // Changed from phonenumber
    password: '',
    verifyPassword: '',
  });

  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState('register'); // 'register' or 'verify'
  const [showPassword, setShowPassword] = useState(false);
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const togglePasswordVisibility = (field) => {
    if (field === 'password') setShowPassword(!showPassword);
    else setShowVerifyPassword(!showVerifyPassword);
  };

  const validateForm = () => {
    const errors = {
      name: '',
      email: '',
      phone_number: '', // Changed from phonenumber
      password: '',
      verifyPassword: '',
    };

    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }

    if (!formData.phone_number.trim()) {
      errors.phone_number = 'Phone number is required';
      isValid = false;
    }

    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (formData.password !== formData.verifyPassword) {
      errors.verifyPassword = 'Passwords do not match';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${baseUrl}/api/auth/register`, {
        name: formData.name,
        email: formData.email,
        phone_number: formData.phone_number, // Changed from phonenumber
        password: formData.password,
      });
      console.log('Signup response:', response);
      if (response.status === 201) {
        console.log('Signup successful:', response?.data?.message);
        setStep('verify'); // Move to verification step
      }
    } catch (error) {
      console.error('Signup error:', error);

      if (error.response) {
        const { status, description, data } = error.response.data;
  
        setError(
          data?.message ||
          description ||
          `Error ${status}: Something went wrong.`
        );
      // setError(
      //   error.response?.data?.message ||
      //   (error.request ? 'Network error. Please check your connection.' : 'Internal server error. Please try again.')
      // );
      } else if (error.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    if (!verificationCode) {
      setError('Please enter your verification code');
      setLoading(false);
      return;
    }
  
    try {
      const response = await axios.post(`${baseUrl}/auth/verifyUser`, {
        email: formData.email,
        code: verificationCode,
      });
      console.log('email', formData.email);
      console.log('code', verificationCode);  
      console.log('Verification response:', response);
  
      if (response.status === 200) {
        navigate('/login');
        setFormData({ name: '', email: '', phone_number: '', password: '', verifyPassword: '' });
        setVerificationCode('');
      }
    } catch (error) {
      console.error('Verification error:', error);
  
      if (error.response) {
        const { status, description, data } = error.response.data;
  
        setError(
          data?.message ||
          description ||
          `Error ${status}: Something went wrong.`
        );
      } else if (error.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };  

  return (
    <form onSubmit={step === 'register' ? handleSignup : handleVerifySubmit} className="space-y-4">
      {step === 'register' ? (
        <>
          <InputField
            type="text"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleInputChange}
            error={formErrors.name}
          />
          <InputField
            type="email"
            name="email"
            placeholder="johndoe@email.com"
            value={formData.email}
            onChange={handleInputChange}
            error={formErrors.email}
          />
          <InputField
            type="tel"
            name="phone_number" // Changed from phonenumber
            placeholder="+254712345678"
            value={formData.phone_number}
            onChange={handleInputChange}
            error={formErrors.phone_number}
          />
          <InputField
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            error={formErrors.password}
            showToggle
            toggleVisibility={() => togglePasswordVisibility('password')}
            showPassword={showPassword}
          />
          <InputField
            type="password"
            name="verifyPassword"
            placeholder="Verify Password"
            value={formData.verifyPassword}
            onChange={handleInputChange}
            error={formErrors.verifyPassword}
            showToggle
            toggleVisibility={() => togglePasswordVisibility('verifyPassword')}
            showPassword={showVerifyPassword}
          />
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700">Enter Verification Code received via email/phone number entered</label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter your 6-digit code"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            required
          />
        </div>
      )}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
        disabled={loading}
      >
        {loading ? 'Processing...' : step === 'register' ? 'Sign Up' : 'Verify'}
      </button>
    </form>
  );
};

export default SignupForm;