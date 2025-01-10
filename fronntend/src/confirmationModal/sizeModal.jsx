// SizeModal.jsx
import React from 'react';

const SizeModal = ({ isOpen, onClose, product, onSelectSize, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Select Size - {product?.productName}</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-3 gap-2">
            {product?.availableSizes.map((size) => (
              <button
                key={size.size}
                onClick={() => onSelectSize(size)}
                disabled={size.quantity === 0 || isLoading}
                className={`
                  p-3 rounded-md transition-all 
                  ${size.quantity === 0 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-100 hover:bg-gray-200'
                  }
                  ${isLoading ? 'cursor-not-allowed opacity-50' : ''}
                `}
              >
                {size.size}
                <span className="block text-xs mt-1">
                  {size.quantity > 0 ? `${size.quantity} left` : 'Out of stock'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizeModal;