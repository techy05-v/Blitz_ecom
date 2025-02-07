import React from 'react';
import { X, LogIn, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Modal = ({ isOpen, onClose, redirectPath = "/" }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogin = () => {
    navigate('/user/login', {
      state: {
        from: redirectPath,
        message: 'Please login to continue'
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl transform transition-all animate-in slide-in-from-bottom-4 duration-300">
        {/* Close Button */}
        <div className="flex justify-end">
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-black p-3 rounded-full">
            <LogIn className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Sign in to continue
          </h2>
          <p className="text-gray-600">
            Please log in to your account to access all features and continue your shopping experience
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleLogin}
            className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium
              hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2
              shadow-lg shadow-yellow-600/20 hover:shadow-blue-600/30"
          >
            Sign In
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium
              hover:bg-gray-200 transition-colors duration-200"
          >
            Cancel
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <button
            onClick={() => {
              navigate('/user/signup');
              onClose();
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;