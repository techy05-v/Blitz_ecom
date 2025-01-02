import React, { useState, useEffect } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const QuantityLimitModal = ({ isOpen, onClose, maxQuantity }) => {
  const [animationClass, setAnimationClass] = useState('opacity-0 scale-95');
  const [iconClass, setIconClass] = useState('opacity-0 scale-0');

  useEffect(() => {
    let timer;
    if (isOpen) {
      setAnimationClass('opacity-100 scale-100');
      setTimeout(() => setIconClass('opacity-100 scale-100'), 300);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
      <div className={`inline-block bg-white rounded-lg shadow-xl transform transition-all flex flex-col items-center justify-center p-8 relative ${animationClass}`} style={{ width: '350px' }}>
        <div className="bg-yellow-500 rounded-full flex items-center justify-center p-4">
          <ExclamationTriangleIcon className={`text-white transform transition-all duration-500 ease-in-out h-12 w-12 ${iconClass}`} />
        </div>
        <h2 className="text-xl font-semibold mt-6 text-gray-800">
          Quantity Limit Reached
        </h2>
        <p className="text-gray-600 text-center mt-2">
          Oops! You've reached the maximum quantity limit ({maxQuantity} items) for this product.
        </p>
        <div className="mt-6 flex items-center">
          <span className="text-2xl mr-2" role="img" aria-label="Sad face"></span>
          <button onClick={onClose} className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-6 rounded-md transition duration-300 flex items-center">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuantityLimitModal;

