import React from 'react';
import { Link } from 'react-router-dom';

const Wishlist = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Wishlist</h1>
        <p>Your wishlist items go here.</p>
        <Link to="/user/dashboard" className="mt-4 inline-block text-blue-600 hover:underline">Back to Dashboard</Link>
      </div>
    </div>
  );
};

export default Wishlist;

