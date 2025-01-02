import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { adminLogin } from '../../redux/slice/AdminSlice'; // Adjust the import path
import { axiosInstance } from '../../api/axiosConfig'; // Import your Axios instance
import { useNavigate } from 'react-router-dom';  // Import useNavigate
import storeAccessToken from "../../utils/token store/storeAccessToken"
import registerImage from "../../assets/3d-user-login-form-page_169241-6920.avif"
export default function AdminLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();  // Initialize navigate
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await axiosInstance.post('/auth/signin', formData);
  
      // Destructure using the correct key from backend
      const { adminData, accessToken, role } = response.data;
  
      // Store the token in cookies
      storeAccessToken(role, accessToken);
  
      // Dispatch login action
      dispatch(adminLogin({ 
        adminData: adminData, 
        token: accessToken 
      }));
  
      console.log('Login successful:', response.data);
  
      // Redirect to the admin dashboard
      navigate('/admin/dashboard');
    } catch (err) {
      // Handle errors
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      console.error('Error logging in:', err.response?.data || err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-600 p-4">
      <div className="bg-white rounded-2xl shadow-xl flex flex-col md:flex-row max-w-4xl w-full">
        {/* Left Side - Illustration */}
        <div className="md:w-1/2 p-8">
          <div className="text-xl font-bold text-purple-600 mb-8">Creative</div>
          <img
            src={registerImage}
            alt="Login illustration"
            className="w-full max-w-md mx-auto"
          />
        </div>

        {/* Right Side - Login Form */}
        <div className="md:w-1/2 p-8">
          <div className="flex justify-end mb-8">
            <span className="text-sm text-gray-500">New User?</span>
            <a href="#" className="text-sm text-purple-600 ml-2">Sign Up</a>
          </div>

          <h2 className="text-2xl font-bold mb-1">Welcome Back!</h2>
          <p className="text-gray-500 mb-8">Login to continue</p>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="email"
                name="email"
                placeholder="username11@gmail.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                required
              />
            </div>

            <div>
              <input
                type="password"
                name="password"
                placeholder="Enter Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              LOGIN
            </button>
          </form>

          <a href="#" className="block text-center text-sm text-purple-600 mt-4">
            FORGOT PASSWORD?
          </a>
        </div>
      </div>
    </div>
  );
}
