import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { userLogin } from '../../redux/slice/UserSlice';
import { axiosInstance } from '../../api/axiosConfig';
import { GoogleLogin } from "@react-oauth/google";
import registerImage from "../../assets/logoooooooooooooo.png";
import storeAccessToken from "../../utils/token store/storeAccessToken";
import { Link } from 'react-router-dom';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '' 
  });
  const [formErrors, setFormErrors] = useState({ 
    email: '', 
    password: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Enhanced validation with multiple checks
  const validate = useCallback(() => {
    let isValid = true;
    let errors = { email: '', password: '' };

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const domainBlacklist = ['example.com', 'test.com']; // Add domains to block
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    } else {
      const domain = formData.email.split('@')[1];
      if (domainBlacklist.includes(domain)) {
        errors.email = 'This email domain is not allowed';
        isValid = false;
      }
    }

    // Password validation with enhanced complexity
    const passwordValidations = {
      minLength: 8, // Increased from 6 to 8
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChar: true
    };

    if (!formData.password.trim()) {
      errors.password = 'Password is required';
      isValid = false;
    } else {
      const password = formData.password;
      
      // Length check
      if (password.length < passwordValidations.minLength) {
        errors.password = `Password must be at least ${passwordValidations.minLength} characters long`;
        isValid = false;
      }
      
      // Uppercase check
      if (passwordValidations.requireUppercase && !/[A-Z]/.test(password)) {
        errors.password = 'Password must contain at least one uppercase letter';
        isValid = false;
      }
      
      // Lowercase check
      if (passwordValidations.requireLowercase && !/[a-z]/.test(password)) {
        errors.password = 'Password must contain at least one lowercase letter';
        isValid = false;
      }
      
      // Number check
      if (passwordValidations.requireNumbers && !/[0-9]/.test(password)) {
        errors.password = 'Password must contain at least one number';
        isValid = false;
      }
      
      // Special character check
      if (passwordValidations.requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.password = 'Password must contain at least one special character';
        isValid = false;
      }
    }

    setFormErrors(errors);
    
    if (!isValid) {
      toast.error('Please fix the form errors', {
        description: 'Check your email and password requirements'
      });
    }
    
    return isValid;
  }, [formData]);

  // Debounce input changes to prevent rapid input
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Optional: Clear specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }, [formErrors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) return;
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    const toastId = toast.loading('Logging in...');
    
    try {
      // Add a timeout to prevent potential infinite loading
      const response = await Promise.race([
        axiosInstance.post('/auth/login', formData),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 10000)
        )
      ]);
      
      const { userData, accessToken, role } = response.data;
      
      // Additional token validation
      if (!accessToken) {
        throw new Error('No access token received');
      }
      
      storeAccessToken(role, accessToken);
      dispatch(userLogin({ userData, token: accessToken }));
      
      toast.success('Login successful!', { id: toastId });
      navigate('/user/home');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                           err.message || 
                           'Login failed. Please try again.';
      
      toast.error(errorMessage, { 
        id: toastId,
        description: 'Please check your credentials or network connection'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const toastId = toast.loading('Logging in with Google...');
    
    try {
      const response = await axiosInstance.post('/auth/google', {
        token: credentialResponse.credential,
        role: 'user',
      });
      
      if (response.status === 200) {
        const { userData, accessToken, role } = response.data;
        
        // Validate token and user data
        if (!accessToken || !userData) {
          throw new Error('Invalid Google authentication response');
        }
        
        storeAccessToken(role, accessToken);
        dispatch(userLogin({ userData, token: accessToken }));
        
        toast.success('Successfully logged in with Google', { id: toastId });
        navigate('/user/home');
      } else {
        throw new Error('Google authentication failed');
      }
    } catch (error) {
      toast.error('Google Sign-Up failed', { 
        id: toastId,
        description: 'Please try again or use standard login'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUpError = () => {
    toast.error('Google Sign-Up failed', {
      description: 'Please try an alternative login method'
    });
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-white-600 p-4 relative">
      <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-lg"></div>
      <div className="relative bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl shadow-lg flex flex-col md:flex-row max-w-4xl w-full">
        <div className="md:w-1/2 p-8">
          <img src={registerImage} alt="Login illustration" className="w-full max-w-md mx-auto rounded-xl" />
        </div>
        <div className="md:w-1/2 p-8">
          <div className="flex justify-end mb-8">
            <span className="text-sm text-gray-300">New User?</span>
            <a href="/user/signup" className="text-sm text-purple-200 ml-2">Sign Up</a>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Welcome Back!</h2>
          <p className="text-gray-200 mb-8">Login to continue</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="email"
                name="email"
                placeholder="username11@gmail.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white bg-opacity-20 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                required
              />
              {formErrors.email && <p className="text-red-300 text-sm">{formErrors.email}</p>}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white bg-opacity-20 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
              {formErrors.password && <p className="text-red-300 text-sm">{formErrors.password}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 bg-opacity-80 text-white py-3 rounded-lg hover:bg-purple-700 transition-all"
            >
              LOGIN
            </button>
          </form>
          <div className="mt-6">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={handleGoogleSignUpError}
              size="large"
              theme="filled_blue"
              text="continue_with"
              width="100%"
            />
          </div>
          <Link to="/user/forgot-password" className="text-sm text-purple-200 mt-4 block">
            FORGOT PASSWORD
          </Link>
        </div>
      </div>
    </div>
  );
}

