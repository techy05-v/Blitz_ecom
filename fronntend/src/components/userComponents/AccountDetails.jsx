import { Calendar, Upload, User } from 'lucide-react'
import { useState } from 'react'

export default function UserProfile() {
  const [profileImage, setProfileImage] = useState(null)
  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    gender: '',
    dob: '',
    address: {
      type: 'home',
      street: '',
      apartment: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      landmark: ''
    }
  })

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'your_upload_preset')
      
      try {
        const response = await fetch('https://api.cloudinary.com/v1_1/your_cloud_name/image/upload', {
          method: 'POST',
          body: formData
        })
        const data = await response.json()
        setProfileImage(data.secure_url)
      } catch (error) {
        console.error('Upload failed:', error)
      }
    }
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    if (id.startsWith('address.')) {
      const addressField = id.split('.')[1]
      setUserData({
        ...userData,
        address: { ...userData.address, [addressField]: value }
      })
    } else {
      setUserData({ ...userData, [id]: value })
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="flex items-start gap-4">
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
          {profileImage ? (
            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User className="w-12 h-12 text-gray-400" />
          )}
        </div>
        <label className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 cursor-pointer">
          <Upload className="w-4 h-4 mr-2" />
          Upload photo
          <input type="file" className="hidden" onChange={handleProfileImageChange} accept="image/*" />
        </label>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Personal Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              id="fullName"
              value={userData.fullName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              value={userData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              value={userData.phoneNumber}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="dob" className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <div className="relative">
              <input
                type="date"
                id="dob"
                value={userData.dob}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              />
              <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Address Details</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="address.type" className="block text-sm font-medium text-gray-700">Address Type</label>
            <select
              id="address.type"
              value={userData.address.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            >
              <option value="home">Home</option>
              <option value="work">Work</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="address.street" className="block text-sm font-medium text-gray-700">Street Address</label>
            <input
              type="text"
              id="address.street"
              value={userData.address.street}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="address.city" className="block text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              id="address.city"
              value={userData.address.city}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="address.state" className="block text-sm font-medium text-gray-700">State</label>
            <input
              type="text"
              id="address.state"
              value={userData.address.state}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="address.postalCode" className="block text-sm font-medium text-gray-700">Postal Code</label>
            <input
              type="text"
              id="address.postalCode"
              value={userData.address.postalCode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
        Save Changes
      </button>
    </div>
  )
}