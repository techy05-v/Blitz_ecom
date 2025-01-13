import React, { useState, useEffect } from 'react';
import { axiosInstance } from "../../api/axiosConfig";

const Coupon = () => {
    const [coupons, setCoupons] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        description: '',
        expiresOn: '',
        offerPercentage: '',
        minimumPrice: '',
        maximumDiscount: '',
        usageLimit: ''
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/admin/list');
            setCoupons(response.data.coupons);
        } catch (error) {
            console.error('Error details:', error.response?.data);
            setError('Error fetching coupons: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        const processedValue = type === 'number' ? (value === '' ? '' : Number(value)) : value;
        
        setNewCoupon(prev => ({
            ...prev,
            [name]: processedValue
        }));
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Format the data properly before sending
        const formattedCoupon = {
            ...newCoupon,
            offerPercentage: Number(newCoupon.offerPercentage),
            minimumPrice: Number(newCoupon.minimumPrice),
            maximumDiscount: Number(newCoupon.maximumDiscount),
            usageLimit: Number(newCoupon.usageLimit)
        };

        try {
            const response = await axiosInstance.post('/admin/create', formattedCoupon);
            
            if (response.data.success) {
                setSuccess('Coupon created successfully!');
                setNewCoupon({
                    code: '',
                    description: '',
                    expiresOn: '',
                    offerPercentage: '',
                    minimumPrice: '',
                    maximumDiscount: '',
                    usageLimit: ''
                });
                await fetchCoupons();
            }
        } catch (error) {
            console.error('Error details:', error.response?.data);
            const errorMessage = error.response?.data?.message || 'Error creating coupon';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            setLoading(true);
            await axiosInstance.delete(`/admin/delete/${id}`);
            setSuccess('Coupon deleted successfully!');
            await fetchCoupons();
        } catch (error) {
            console.error('Error details:', error.response?.data);
            setError('Error deleting coupon: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Admin Coupon Management</h1>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Create New Coupon</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    
                    {success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                            <span className="block sm:inline">{success}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Coupon Code
                            </label>
                            <input
                                type="text"
                                name="code"
                                value={newCoupon.code}
                                onChange={handleInputChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                placeholder="e.g., SUMMER2024"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Expiry Date
                            </label>
                            <input
                                type="date"
                                name="expiresOn"
                                value={newCoupon.expiresOn}
                                onChange={handleInputChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Discount Percentage
                            </label>
                            <input
                                type="number"
                                name="offerPercentage"
                                value={newCoupon.offerPercentage}
                                onChange={handleInputChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                placeholder="Enter percentage"
                                min="0"
                                max="100"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Minimum Purchase Amount
                            </label>
                            <input
                                type="number"
                                name="minimumPrice"
                                value={newCoupon.minimumPrice}
                                onChange={handleInputChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                placeholder="Minimum amount"
                                min="0"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Maximum Discount Amount
                            </label>
                            <input
                                type="number"
                                name="maximumDiscount"
                                value={newCoupon.maximumDiscount}
                                onChange={handleInputChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                placeholder="Maximum discount"
                                min="0"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Usage Limit
                            </label>
                            <input
                                type="number"
                                name="usageLimit"
                                value={newCoupon.usageLimit}
                                onChange={handleInputChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                placeholder="Number of times coupon can be used"
                                min="1"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={newCoupon.description}
                            onChange={handleInputChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Coupon description"
                            rows="3"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create Coupon'}
                    </button>
                </form>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Active Coupons</h2>
                
                {loading && (
                    <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coupons.map((coupon) => (
                        <div key={coupon._id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-gray-800">{coupon.code}</h3>
                                <button
                                    onClick={() => handleDelete(coupon._id)}
                                    className="text-red-500 hover:text-red-700"
                                    disabled={loading}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{coupon.description}</p>
                            <div className="space-y-1 text-sm">
                                <p className="text-gray-600">
                                    <span className="font-semibold">Expires:</span> {formatDate(coupon.expiresOn)}
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-semibold">Discount:</span> {coupon.offerPercentage}%
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-semibold">Min Purchase:</span> ₹{coupon.minimumPrice}
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-semibold">Max Discount:</span> ₹{coupon.maximumDiscount}
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-semibold">Usage:</span> {coupon.usedCount}/{coupon.usageLimit}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {coupons.length === 0 && !loading && (
                    <div className="text-center py-4 text-gray-500">
                        No active coupons found
                    </div>
                )}
            </div>
        </div>
    );
};

export default Coupon;