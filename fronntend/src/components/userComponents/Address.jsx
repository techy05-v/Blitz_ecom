import React, { useState, useEffect } from 'react'
import { Edit2, Trash2 } from 'lucide-react'
import { addressService } from '../../api/addressService/addressService'
import { toast } from 'sonner'
import ConfirmationModal from '../../confirmationModal/ConfirmationMadal'

const AddressManager = () => {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [addressToDelete, setAddressToDelete] = useState(null)
  const [errors, setErrors] = useState({})
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
  })
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    setLoading(true)
    try {
      const data = await addressService.getAllAddress()
      setAddresses(data)
      setError(null)
    } catch (err) {
      setError('Failed to fetch addresses: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+?[1-9]\d{9,11}$/;
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
        return validatePostalCode(value) ? '' : 'Please enter a valid postal code (5-10 digits)';
      default:
        return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))

    if (type !== 'checkbox') {
      const error = validateField(name, value)
      setErrors(prev => ({
        ...prev,
        [name]: error
      }))
    }
  }

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
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please correct the errors in the form')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      if (editingId) {
        await addressService.updateAddress(editingId, formData)
      } else {
        await addressService.createAddress(formData)
      }
      
      await fetchAddresses()
      
      resetForm()
      toast.success(editingId ? "Address updated successfully" : "Address added successfully")
      setEditingId(null)
    
    } catch (err) {
      setError(editingId ? 'Failed to update address: ' : 'Failed to add address: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
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
    })
    setErrors({})
  }

  const handleEdit = (address) => {
    setFormData(address)
    setEditingId(address._id)
    setErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteClick = (address) => {
    setAddressToDelete(address)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!addressToDelete) return
    
    setLoading(true)
    try {
      await addressService.deletAddress(addressToDelete._id)
      await fetchAddresses()
      toast.success("Address deleted successfully")
      setIsDeleteModalOpen(false)
    } catch (err) {
      setError('Failed to delete address: ' + err.message)
    } finally {
      setLoading(false)
      setAddressToDelete(null)
    }
  }

  const renderInput = (name, label, type = "text", required = true) => (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        required={required}
        className={`mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm rounded-md ${
          errors[name] ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {errors[name] && (
        <p className="mt-1 text-sm text-red-500">{errors[name]}</p>
      )}
    </div>
  )

  if (loading && !addresses.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Manage Addresses</h1>
      
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Address"
        message="Are you sure you want to delete this address? This action cannot be undone."
      />
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left side - Form */}
        <div className="lg:w-1/2">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">{editingId ? 'Edit Address' : 'Add New Address'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="address_type" className="block text-sm font-medium text-gray-700">
                    Address Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="address_type"
                    name="address_type"
                    value={formData.address_type}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                {renderInput("full_name", "Full Name")}
                {renderInput("phone_number", "Phone Number", "tel")}
                {renderInput("street_address", "Street Address")}
                {renderInput("apartment", "Apartment", "text", false)}
                {renderInput("city", "City")}
                {renderInput("state", "State")}
                {renderInput("country", "Country")}
                {renderInput("postal_code", "Postal Code")}
                {renderInput("landmark", "Landmark", "text", false)}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_default"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
                    Set as default address
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (editingId ? 'Update Address' : 'Add Address')}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null)
                      resetForm()
                    }}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
        
        {/* Right side - Address List */}
        <div className="lg:w-1/2">
          <h2 className="text-2xl font-bold mb-6">Your Addresses</h2>
          
          {loading && addresses.length > 0 && (
            <div className="text-center py-4">Updating...</div>
          )}
          
          {addresses.length === 0 ? (
            <div className="bg-white shadow-md rounded-lg">
              <div className="text-center py-8 text-gray-500">
                No addresses found. Add your first address using the form.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div key={address._id} className="bg-white shadow-md rounded-lg transition-shadow hover:shadow-lg">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-lg">{address.full_name}</h3>
                      {address.is_default && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      <p>{address.street_address}{address.apartment && `, ${address.apartment}`}</p>
                      <p>{`${address.city}, ${address.state} ${address.postal_code}`}</p>
                      <p>{address.country}</p>
                      <p>Phone: {address.phone_number}</p>
                      <p className="capitalize">Type: {address.address_type}</p>
                      {address.landmark && <p>Landmark: {address.landmark}</p>}
                    </div>
                  </div>
                  <div className="bg-gray-50 px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(address)}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Edit2 className="mr-2 h-4 w-4" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(address)}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddressManager