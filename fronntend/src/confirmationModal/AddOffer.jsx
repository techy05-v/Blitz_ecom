import React, { useState, useEffect } from "react";

export default function AddEditOfferModal({ isOpen, onClose, onSubmit, product }) {
  const [offerData, setOfferData] = useState({
    name: "",
    discountPercent: 0,
    startDate: "",
    endDate: "",
    targetId: "",
    targetType: "product"
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      const hasOffers = product.offers && product.offers.length > 0;
      const selectedOffer = hasOffers ? product.offers[0] : null;
  
      if (selectedOffer) {
        const formatDateForInput = (dateString) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };
  
        setOfferData({
          _id: selectedOffer._id,
          name: selectedOffer.name || "",
          discountPercent: selectedOffer.discountPercent || 0,
          startDate: formatDateForInput(selectedOffer.startDate),
          endDate: formatDateForInput(selectedOffer.endDate),
          targetId: product._id,
          targetType: "product"
        });
      } else {
        setOfferData({
          name: "",
          discountPercent: 0,
          startDate: "",
          endDate: "",
          targetId: product._id,
          targetType: "product"
        });
      }
      setErrors({});
    }
  }, [product]);

  const validateForm = () => {
    const newErrors = {};
    const today = new Date().setHours(0, 0, 0, 0);
    const startDate = new Date(offerData.startDate);
    const endDate = new Date(offerData.endDate);

    // Name validation
    if (!offerData.name.trim()) {
      newErrors.name = 'Offer name is required';
    } else if (offerData.name.length < 3) {
      newErrors.name = 'Offer name must be at least 3 characters';
    } else if (offerData.name.length > 50) {
      newErrors.name = 'Offer name cannot exceed 50 characters';
    }

    // Discount validation
    if (!Number.isInteger(Number(offerData.discountPercent))) {
      newErrors.discountPercent = 'Discount must be a whole number';
    } else if (offerData.discountPercent < 0) {
      newErrors.discountPercent = 'Discount cannot be negative';
    } else if (offerData.discountPercent > 100) {
      newErrors.discountPercent = 'Discount cannot exceed 100%';
    }

    // Date validation
    if (!offerData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else if (startDate < today) {
      newErrors.startDate = 'Start date cannot be in the past';
    }

    if (!offerData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (endDate < today) {
      newErrors.endDate = 'End date cannot be in the past';
    } else if (endDate <= startDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOfferData((prev) => ({
      ...prev,
      [name]: name === "discountPercent" ? Number(value) : value
    }));
    // Clear the error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const formatDateForSubmit = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toISOString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }
    
    try {
      const formattedData = {
        ...offerData,
        discountPercent: Number(offerData.discountPercent),
        startDate: formatDateForSubmit(offerData.startDate),
        endDate: formatDateForSubmit(offerData.endDate),
        targetId: product._id,
        targetType: "product"
      };

      if (product?.offers?.[0]?._id) {
        formattedData._id = product.offers[0]._id;
      }

      await onSubmit(formattedData);
      onClose();
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        submit: error.message || 'Failed to submit offer'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isEditing = Boolean(product?.offers?.[0]?._id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-2xl font-bold mb-4">
          {isEditing ? "Edit Offer" : "Add Offer"}
        </h2>
        {errors.submit && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {errors.submit}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Offer Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={offerData.name}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${
                errors.name 
                  ? 'border-red-300 focus:border-red-300 focus:ring-red-200'
                  : 'border-gray-300 focus:border-indigo-300 focus:ring-indigo-200'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="discountPercent" className="block text-sm font-medium text-gray-700">
              Discount Percentage
            </label>
            <input
              type="number"
              id="discountPercent"
              name="discountPercent"
              value={offerData.discountPercent}
              onChange={handleChange}
              min="0"
              max="100"
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${
                errors.discountPercent 
                  ? 'border-red-300 focus:border-red-300 focus:ring-red-200'
                  : 'border-gray-300 focus:border-indigo-300 focus:ring-indigo-200'
              }`}
            />
            {errors.discountPercent && (
              <p className="mt-1 text-sm text-red-600">{errors.discountPercent}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={offerData.startDate}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${
                errors.startDate 
                  ? 'border-red-300 focus:border-red-300 focus:ring-red-200'
                  : 'border-gray-300 focus:border-indigo-300 focus:ring-indigo-200'
              }`}
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={offerData.endDate}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring focus:ring-opacity-50 ${
                errors.endDate 
                  ? 'border-red-300 focus:border-red-300 focus:ring-red-200'
                  : 'border-gray-300 focus:border-indigo-300 focus:ring-indigo-200'
              }`}
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? "Submitting..." 
                : isEditing 
                  ? "Update Offer" 
                  : "Add Offer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}