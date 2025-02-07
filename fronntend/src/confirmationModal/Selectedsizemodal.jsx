import React, { useState } from "react";

const SelectSizeModal = ({ isOpen, onClose }) => {
  const [selectedSize, setSelectedSize] = useState(null);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md z-50">
      <div className="bg-gradient-to-br from-white via-purple-50 to-blue-50 p-8 rounded-3xl shadow-2xl w-80 transform transition-all duration-500 animate-in zoom-in-95 border border-white/50">
        <div className="relative text-center">
          <div className="absolute -top-6 -left-6 w-24 h-24 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl" />
          <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-gradient-to-r from-blue-400/20 to-teal-400/20 rounded-full blur-xl" />
          
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Size
          </h2>
          <p className="text-gray-500 font-medium text-sm">
            Choose your style
          </p>
        </div>

        <div className="flex justify-center gap-4 mt-8">
          {["S", "M", "L","XL"].map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`w-14 h-14 rounded-2xl bg-white shadow-lg hover:shadow-xl 
                transition-all duration-300 font-bold text-lg
                ${selectedSize === size 
                  ? "scale-110 border-2 border-purple-400 text-purple-600 shadow-purple-200" 
                  : "hover:scale-105 text-gray-700 hover:text-purple-600 border border-gray-100"
                }`}
            >
              {size}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 
            text-white rounded-2xl font-medium shadow-lg hover:shadow-xl 
            hover:scale-[1.02] transition-all duration-300 
            hover:bg-gradient-to-r hover:from-purple-500 hover:via-pink-500 hover:to-blue-500"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default SelectSizeModal;