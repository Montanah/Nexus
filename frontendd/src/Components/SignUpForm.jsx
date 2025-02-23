import { useState } from 'react';
import InputField from './InputField';
import axios from 'axios';

const SignupForm = ({ navigate }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    verifyPassword: '',
  });

  const [formErrors, setFormErrors] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    verifyPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);

  const togglePasswordVisibility = (field) => {
    if (field === 'password') setShowPassword(!showPassword);
    else setShowVerifyPassword(!showVerifyPassword);
  };

  const validateForm = () => {
    const errors = {
      fullName: '',
      email: '',
      phoneNumber: '',
      password: '',
      verifyPassword: '',
    };

    let isValid = true;

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
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

    try {
      const response = await axios.post('/register', formData);
      if (response.status === 200 || response.status === 201) {
        navigate('/login');
        setFormData({ fullName: '', email: '', phoneNumber: '', password: '', verifyPassword: '' });
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
        (error.request ? 'Network error. Please check your connection.' : 'An unexpected error occurred.')
      );
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <InputField
        type="text"
        name="fullName"
        placeholder="John Doe"
        value={formData.fullName}
        onChange={handleInputChange}
        error={formErrors.fullName}
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
        name="phoneNumber"
        placeholder="+254712345678"
        value={formData.phoneNumber}
        onChange={handleInputChange}
        error={formErrors.phoneNumber}
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
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors"
      >
        Sign Up
      </button>
    </form>
  );
};

export default SignupForm;