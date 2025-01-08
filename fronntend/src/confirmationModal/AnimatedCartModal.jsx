import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckIcon, XCircleIcon } from '@heroicons/react/24/solid';

const AnimatedCartModal = ({ isOpen, onClose, type = 'success', message }) => {
  const [animationClass, setAnimationClass] = useState('opacity-0 scale-95');
  const [iconClass, setIconClass] = useState('opacity-0 scale-0');
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    let timer;
    if (isOpen) {
      setAnimationClass('opacity-100 scale-100');
      setTimeout(() => setIconClass('opacity-100 scale-100'), 300);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const Icon = isSuccess ? CheckIcon : XCircleIcon;

  const handleButtonClick = () => {
    if (isSuccess) {
      navigate('/user/home'); // Navigate to home page
    } else {
      onClose(); // Close modal
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
      <div className={`inline-block bg-white rounded-lg shadow-xl transform transition-all flex flex-col items-center justify-center p-8 relative ${animationClass}`} style={{ width: '350px' }}>
        <div className={`${isSuccess ? 'bg-green-500' : 'bg-red-500'} rounded-full flex items-center justify-center p-4`}>
          <Icon className={`text-white transform transition-all duration-500 ease-in-out h-12 w-12 ${iconClass}`} />
        </div>
        <h2 className={`text-xl font-semibold mt-6 ${isSuccess ? 'text-gray-800' : 'text-red-700'}`}>
          {isSuccess ? 'Success!' : 'Oops!'}
        </h2>
        <p className={`text-gray-600 text-center mt-2`}>
          {message}
        </p>
        <div className="mt-6 flex items-center">
          {!isSuccess && <span className="text-2xl mr-2" role="img" aria-label="Sad face"></span>}
          <button onClick={handleButtonClick} className={`${isSuccess ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white font-medium py-2 px-6 rounded-md transition duration-300 flex items-center`}>
            {isSuccess ? 'Continue Shopping' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnimatedCartModal;
