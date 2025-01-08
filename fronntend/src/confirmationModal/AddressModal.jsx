import React, { useState } from "react";
import { toast } from "sonner";
import { addressService } from "../api/addressService/addressService";

const AddressFormModal = ({ isOpen, onClose, onAddressAdded }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    address_type: 'home',
    full_name: '',
    phone_number: '',
    street_address: '',
    apartment: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    is_default: false,
    landmark: ''
  });

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+?[1-9]\d{7,14}$/;
    return phoneRegex.test(phone);
  };

  const validatePostalCode = (postalCode) => {
    const postalRegex = /^[0-9]{5,10}$/;
    return postalRegex.test(postalCode);
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'full_name':
        return value.length >= 2 && value.length <= 50 ? '' : 'Name must be between 2 and 50 characters';
      case 'phone_number':
        return validatePhoneNumber(value) ? '' : 'Please enter a valid phone number';
      case 'street_address':
        return value.length >= 5 && value.length <= 100 ? '' : 'Street address must be between 5 and 100 characters';
      case 'city':
        return value.length >= 2 && value.length <= 50 ? '' : 'City must be between 2 and 50 characters';
      case 'state':
        return value.length >= 2 && value.length <= 50 ? '' : 'State must be between 2 and 50 characters';
      case 'country':
        return value.length >= 2 && value.length <= 50 ? '' : 'Country must be between 2 and 50 characters';
      case 'postal_code':
        return validatePostalCode(value) ? '' : 'Please enter a valid postal code';
      default:
        return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    if (type !== 'checkbox') {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'apartment' && key !== 'landmark' && key !== 'is_default') {
        const error = validateField(key, formData[key]);
        if (error) {
          newErrors[key] = error;
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }

    setLoading(true);
    
    try {
      await addressService.createAddress(formData);
      toast.success("Address added successfully");
      onAddressAdded();
      onClose();
      setFormData({
        address_type: 'home',
        full_name: '',
        phone_number: '',
        street_address: '',
        apartment: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
        is_default: false,
        landmark: ''
      });
      setErrors({});
    } catch (error) {
      toast.error(error.message || 'Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderInput = (name, label, type = "text", required = true) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        required={required}
        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
          errors[name] ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {errors[name] && (
        <p className="mt-1 text-sm text-red-500">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Add New Address</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Address Type</label>
                <select
                  name="address_type"
                  value={formData.address_type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {renderInput("full_name", "Full Name")}
              {renderInput("phone_number", "Phone Number", "tel")}
              {renderInput("street_address", "Street Address")}
              {renderInput("apartment", "Apartment (Optional)", "text", false)}
              {renderInput("city", "City")}
              {renderInput("state", "State")}
              {renderInput("country", "Country")}
              {renderInput("postal_code", "Postal Code")}
              {renderInput("landmark", "Landmark (Optional)", "text", false)}
            </div>

            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="is_default"
                name="is_default"
                checked={formData.is_default}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
                Set as default address
              </label>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Address'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddressFormModal;