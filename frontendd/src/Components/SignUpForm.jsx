import { useState } from 'react';
import InputField from './InputField';
import axios from 'axios';

const SignupForm = ({ navigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phonenumber: '',
    password: '',
    verifyPassword: '',
  });

  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    phonenumber: '',
    password: '',
    verifyPassword: '',
  });

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
      phonenumber: '',
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

    if (!formData.phonenumber.trim()) {
      errors.phonenumber = 'Phone number is required';
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
      const response = await axios.post('/api/register', {
        name: formData.name,
        email: formData.email,
        phonenumber: formData.phonenumber,
        password: formData.password,
      });
      if (response.status === 200 || response.status === 201) {
        console.log('Signup successful:', response.data);
        navigate('/login'); // Redirect to login
        setFormData({ name: '', email: '', phonenumber: '', password: '', verifyPassword: '' });
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError(
        error.response?.data?.message ||
        (error.request ? 'Network error. Please check your connection.' : 'Internal server error. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
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
        name="phonenumber"
        placeholder="+254712345678"
        value={formData.phonenumber}
        onChange={handleInputChange}
        error={formErrors.phonenumber}
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
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
        disabled={loading}
      >
        {loading ? 'Signing Up...' : 'Sign Up'}
      </button>
    </form>
  );
};

export default SignupForm;