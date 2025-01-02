import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";
import OtpModal from "../../OTP/OtpModal";
import { axiosInstance } from "../../api/axiosConfig";
import registerImage from "../../assets/hero-illustration-2.png";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    user_name: "",
    email: "",
    password: "",
  });
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.user_name.trim()) {
      newErrors.user_name = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
  
    setIsSubmitting(true);
    try {
      console.log("Making API request with data:", formData);
      const response = await axiosInstance.post('/auth/signup', formData);
      console.log("API Response:", response.data);
      
      if (response.status === 201 || response.data.message?.includes("OTP sent")) {
        console.log("Success condition met, showing OTP modal");
        toast.success('Registration successful! Please verify your email.');
        setShowOtpModal(true);
        setTimeLeft(60);
      } else {
        toast.error(response.data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response?.status === 400) {
        toast.error('This email is already registered. Please use a different email.');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Registration failed. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (otpString) => {
    try {
      const response = await axiosInstance.post("/auth/verifyOtp", {
        email: formData.email,
        otp: otpString,
      });
  
      if (response.status === 200) {
        toast.success(response.data.message);
        setShowOtpModal(false);
        setTimeout(()=>{
          navigate("/user/login", { replace: true });
        },3000)
        return "OTP verified successfully";
      } else {
        return response.data.message || "Invalid OTP. Please try again.";
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      return error.response?.data?.message || "Verification failed. Please try again.";
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) {
      return "Please wait before requesting a new OTP.";
    }

    try {
      const response = await axiosInstance.post("/auth/resendotp", {
        email: formData.email,
      });

      if (response.data.success) {
        setTimeLeft(60);
        return "OTP resent successfully!";
      } else {
        return response.data.message || "Failed to resend OTP.";
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      return error.response?.data?.message || "Failed to resend OTP. Please try again.";
    }
  };

  const handleCloseOtpModal = () => {
    setShowOtpModal(false);
  };

  const handleGoogleSignUp = async (credentialResponse) => {
    try {
      setIsSubmitting(true);
      const response = await axiosInstance.post('/auth/google', {
        token: credentialResponse.credential,
        role: 'user'
      });
      if (response.status === 200) {
        toast.success('Successfully registered with Google');
        // Store tokens and user data as needed
        // localStorage.setItem('accessToken', response.data.accessToken);
        // localStorage.setItem('userData', JSON.stringify(response.data.userData));
        
        navigate('/user/home'); // Redirect to dashboard or desired page
      }
    } catch (error) {
      console.error('Google Sign-Up Error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Google Sign-Up failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUpError = (error) => {
    console.error('Google Sign-Up Error:', error);
    toast.error('Google Sign-Up failed. Please try again.');
  };

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-white-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white bg-opacity-50 backdrop-blur-lg rounded-2xl shadow-xl flex flex-col md:flex-row max-w-4xl w-full">
        <div className="md:w-1/2 p-8 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-purple-600 mb-8">Welcome!</h2>
          <img
            src={registerImage}
            alt="Register illustration"
            className="w-full max-w-md mx-auto"
          />
        </div>

        <div className="md:w-1/2 p-8 bg-white bg-opacity-70 rounded-r-2xl backdrop-blur-lg">
          <div className="flex justify-end mb-8">
            <span className="text-sm text-gray-500">
              Already have an account?
            </span>
            <button
              onClick={() => navigate("/user/login")}
              className="text-sm text-purple-600 font-semibold ml-2 hover:text-purple-800"
            >
              Sign In
            </button>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create Account
          </h2>
          <p className="text-gray-500 mb-8">Start your journey with us today</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="user_name" className="sr-only">
                Full Name
              </label>
              <input
                id="user_name"
                name="user_name"
                type="text"
                value={formData.user_name}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.user_name ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-purple-600`}
                placeholder="Full Name"
              />
              {errors.user_name && (
                <p className="mt-1 text-sm text-red-500">{errors.user_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.email ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-purple-600`}
                placeholder="Email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.password ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-purple-600`}
                placeholder="Password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 
                       transition-colors duration-200 flex items-center justify-center
                       disabled:bg-purple-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.96 7.96 0 0112 16a7.96 7.96 0 016-2.709V14a5.98 5.98 0 00-4 1.291z"
                    />
                  </svg>
                  Processing...
                </>
              ) : (
                "Sign Up"
              )}
            </button>

            <div className="mt-4 text-center">
              <GoogleLogin
                onSuccess={handleGoogleSignUp}
                onError={handleGoogleSignUpError}
              />
            </div>
          </form>
        </div>
      </div>

      {showOtpModal && (
        <OtpModal
          show={showOtpModal}
          email={formData.email}
          onClose={handleCloseOtpModal}
          onVerify={handleVerify}
          onResend={handleResend}
          timeLeft={timeLeft}
          role = "user"
        />
      )}
    </div>
  );
};

export default Register;
