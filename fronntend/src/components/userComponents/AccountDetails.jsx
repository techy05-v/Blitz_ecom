import React, { useState, useEffect } from 'react';
import { Calendar, Upload, User } from 'lucide-react';
import { axiosInstance } from '../../api/axiosConfig';
import { toast, Toaster } from 'sonner';

const CLOUDINARY_CLOUD_NAME = 'dnxvyozo1';
const CLOUDINARY_UPLOAD_PRESET = 'ecommerce';

// Validation utility functions
const validateName = (name) => {
    if (!name) return 'Name is required';
    if (name.length < 2) return 'Name must be at least 2 characters long';
    if (name.length > 50) return 'Name must be less than 50 characters';
    if (!/^[a-zA-Z\s]*$/.test(name)) return 'Name can only contain letters and spaces';
    return null;
};

const validatePhone = (phone) => {
    if (!phone) return 'Phone number is required';
    if (!/^\+?[1-9]\d{9,10}$/.test(phone)) return 'Please enter a valid phone number';
    return null;
};

const validateGender = (gender) => {
    if (!gender) return 'Gender is required';
    if (!['Male', 'Female', 'Other'].includes(gender)) return 'Please select a valid gender';
    return null;
};

const validateDOB = (dob) => {
    if (!dob) return 'Date of birth is required';
    
    const dobDate = new Date(dob);
    const today = new Date();
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 120); // Maximum age limit
    const maxDate = new Date();
    maxDate.setFullYear(today.getFullYear() - 13); // Minimum age limit
    
    if (dobDate > today) return 'Date of birth cannot be in the future';
    if (dobDate < minDate) return 'Please enter a valid date of birth';
    if (dobDate > maxDate) return 'You must be at least 13 years old';
    
    return null;
};

export default function AccountDetails() {
    const [profileImage, setProfileImage] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        user_name: '',
        phone_number: '',
        gender: '',
        dob: '',
        profileImage: null
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await axiosInstance.get('/user/profileget');
            const userData = response.data.user;
            
            setFormData({
                email: userData.email || '',
                user_name: userData.user_name || '',
                phone_number: userData.phone_number || '',
                gender: userData.gender || '',
                dob: userData.dob ? userData.dob.split('T')[0] : ''
            });
            
            if (userData.profileImage || userData.profile_image) {
                setProfileImage(userData.profileImage || userData.profile_image);
            }
        } catch (error) {
            toast.error('Failed to fetch user data. Please try again.');
            console.error('Fetch error:', error);
        }
    };

    const validateField = (fieldName, value) => {
        switch (fieldName) {
            case 'user_name':
                return validateName(value);
            case 'phone_number':
                return validatePhone(value);
            case 'gender':
                return validateGender(value);
            case 'dob':
                return validateDOB(value);
            default:
                return null;
        }
    };

    const validateForm = () => {
        const newErrors = {};
        let isValid = true;

        // Validate each field
        Object.keys(formData).forEach(fieldName => {
            if (fieldName !== 'email' && fieldName !== 'profileImage') {
                const error = validateField(fieldName, formData[fieldName]);
                if (error) {
                    newErrors[fieldName] = error;
                    isValid = false;
                }
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));

        // Validate field on change
        const error = validateField(id, value);
    
        setErrors(prev => ({
            ...prev,
            [id]: error // This will be null if there's no error
        }));
    };

    const handleProfileImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        // Validate image dimensions
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise((resolve) => {
            img.onload = () => {
                if (img.width < 200 || img.height < 200) {
                    toast.error('Image dimensions should be at least 200x200 pixels');
                    URL.revokeObjectURL(img.src);
                    return;
                }
                URL.revokeObjectURL(img.src);
                resolve();
            };
        });

        setImageUploading(true);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }

            const imageUrl = data.secure_url;
            setProfileImage(imageUrl);
            
            await axiosInstance.put('/user/profile', { profileImage: imageUrl });
            
            toast.success('Profile image updated successfully');
        } catch (error) {
            toast.error('Failed to upload image. Please try again later');
            console.error('Upload error:', error);
        } finally {
            setImageUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error('Please correct the errors before submitting');
            return;
        }
        
        setLoading(true);

        try {
            const response = await axiosInstance.put('/user/profile', {
                user_name: formData.user_name,
                phone_number: formData.phone_number,
                gender: formData.gender,
                dob: formData.dob
            });

            if (response.data.success) {
                toast.success('Profile updated successfully');
                setIsEditing(false);
                await fetchUserProfile();
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error || 
                               error.response?.data?.message || 
                               'Failed to update profile. Please try again later';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getInputClassName = (fieldName) => {
        const baseClasses = 'w-full px-3 py-2 border rounded-md';
        const editingClasses = isEditing 
            ? 'bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500' 
            : 'bg-gray-50';
        const errorClasses = errors[fieldName] 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-300';
        
        return `${baseClasses} ${editingClasses} ${errorClasses}`;
    };

    useEffect(() => {
        if (isEditing) {
            const newErrors = {};
            Object.keys(formData).forEach(fieldName => {
                if (fieldName !== 'email' && fieldName !== 'profileImage') {
                    const error = validateField(fieldName, formData[fieldName]);
                    if (error) {
                        newErrors[fieldName] = error;
                    }
                }
            });
            setErrors(newErrors);
        } else {
            setErrors({});
        }
    }, [isEditing, formData]);

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <Toaster position="top-right" toastOptions={{
                duration: 3000,
                style: {
                    background: '#333',
                    color: '#fff',
                },
            }} />
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="md:flex">
                    <div className="md:flex-shrink-0 bg-gray-800 md:w-1/3 p-8 flex flex-col items-center justify-center">
                        <div className="w-40 h-40 rounded-full bg-white flex items-center justify-center overflow-hidden mb-6 border-4 border-gray-200 shadow-lg">
                            {profileImage ? (
                                <img
                                    src={profileImage}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-20 h-20 text-gray-400" />
                            )}
                        </div>
                        <label 
                            htmlFor="profileImage" 
                            className={`inline-flex items-center px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-md 
                                ${imageUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'} 
                                transition-colors cursor-pointer`}
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            {imageUploading ? 'Uploading...' : 'Change Photo'}
                        </label>
                        <input
                            type="file"
                            id="profileImage"
                            accept="image/*"
                            onChange={handleProfileImageUpload}
                            disabled={imageUploading}
                            className="hidden"
                            aria-label="Upload profile picture"
                        />
                    </div>
                    <div className="p-8 md:w-2/3">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6">Account Details</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="user_name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    id="user_name"
                                    value={formData.user_name}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className={getInputClassName('user_name')}
                                    placeholder="Enter your full name"
                                />
                                {errors.user_name && (
                                    <p className="mt-1 text-sm text-red-500">{errors.user_name}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    id="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className={getInputClassName('phone_number')}
                                    placeholder="Enter your phone number"
                                />
                                {errors.phone_number && (
                                    <p className="mt-1 text-sm text-red-500">{errors.phone_number}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                                    Gender
                                </label>
                                <select
                                    id="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className={getInputClassName('gender')}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                {errors.gender && (
                                    <p className="mt-1 text-sm text-red-500">{errors.gender}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
                                    Date of Birth
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        id="dob"
                                        value={formData.dob}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className={getInputClassName('dob')}
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                </div>
                                {errors.dob && (
                                    <p className="mt-1 text-sm text-red-500">{errors.dob}</p>
                                )}
                            </div>
                            <div className="flex justify-end space-x-4">
                                {!isEditing ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                                    >
                                        Edit Details
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditing(false);
                                                setErrors({});
                                                fetchUserProfile(); // Reset form data
                                            }}
                                            className="px-6 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading || Object.values(errors).some(error => error !== null)}
                                            className={`px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md 
                                                ${(loading || Object.values(errors).some(error => error !== null)) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'} 
                                                transition-colors`}
                                        >
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

