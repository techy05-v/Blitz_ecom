import React from 'react';

const OrderPlacedModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="w-24 h-24 border-t-4 border-b-4 border-green-500 rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-center mt-4">Order Placed!</h2>
        <p className="text-center mt-2">Your order is being processed and will be shipped soon.</p>
        <button
          onClick={onClose}
          className="mt-6 w-full py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600 transition duration-200"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default OrderPlacedModal;

