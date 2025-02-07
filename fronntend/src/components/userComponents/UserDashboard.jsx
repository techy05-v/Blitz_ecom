import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Wallet, MapPin, User, Truck, Clock, ChevronRight } from 'lucide-react';

const UserDashboard = () => {
  const navigate = useNavigate();

  const dashboardItems = [
    { title: 'Shopping Cart', icon: ShoppingCart, content: '', link: '/user/cart', color: 'bg-gradient-to-br from-pink-500 to-rose-600' },
    { title: 'Wishlist', icon: Heart, content: '', link: '/user/wishlist', color: 'bg-gradient-to-br from-purple-500 to-violet-600' },
    { title: 'Wallet', icon: Wallet, content: '', link: '/user/wallet', color: 'bg-gradient-to-br from-emerald-500 to-green-600' },
    { title: 'Address', icon: MapPin, content: '', link: '/user/address', color: 'bg-gradient-to-br from-amber-500 to-yellow-600' },
    { title: 'Account Details', icon: User, content: '', link: '/user/account', color: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
  ];

  const handleItemClick = (link) => {
    navigate(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-gray-900">My Account</h1>
          </div>
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-semibold shadow-lg ring-4 ring-white">
            JD
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <div 
            className="col-span-full p-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl cursor-pointer transition-all duration-300 hover:shadow-2xl"
            onClick={() => handleItemClick('/user/activity')}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Dashboard Overview</h2>
                <p className="text-indigo-100">Track your activity and manage your account</p>
              </div>
              <div className="hidden md:block">
                <button className="px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-300 backdrop-blur-sm text-white font-medium">
                  View Activity
                </button>
              </div>
            </div>
          </div>

          {/* Dashboard Items */}
          {dashboardItems.map((item, index) => (
            <div
              key={index}
              className={`group p-6 rounded-2xl ${item.color} shadow-xl transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer`}
              onClick={() => handleItemClick(item.link)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <div className="p-2 rounded-full bg-white bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300">
                  <item.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-white text-opacity-90 mb-4">{item.content}</p>
              <div 
                className="inline-flex items-center text-white hover:underline group-hover:translate-x-1 transition-transform duration-300"
              >
                View Details
                <ChevronRight className="ml-1 h-4 w-4" />
              </div>
            </div>
          ))}

          {/* Track Order Card */}
          <div 
            className="p-6 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-xl cursor-pointer transition-all duration-300 hover:shadow-2xl"
            onClick={() => handleItemClick('/user/track')}
          >
            <div className="flex items-center mb-4">
              <Truck className="mr-2" size={24} />
              <h2 className="text-xl font-semibold">Track Order</h2>
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Enter Order ID"
                className="flex-grow p-2 rounded-lg bg-white bg-opacity-20 placeholder-white placeholder-opacity-75 text-white border border-transparent focus:border-white focus:outline-none transition-all duration-300"
                onClick={(e) => e.stopPropagation()} // Prevent click on input from triggering parent div click
              />
              <button 
                className="px-4 py-2 bg-white text-teal-600 rounded-lg hover:bg-opacity-90 transition-colors duration-300 font-medium"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent click on button from triggering parent div click
                  handleItemClick('/user/track');
                }}
              >
                Track
              </button>
            </div>
          </div>

          {/* Order History Card */}
          <div 
            className="p-6 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-xl cursor-pointer transition-all duration-300 hover:shadow-2xl"
            onClick={() => handleItemClick('/user/orders')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Clock className="mr-2" size={24} />
                <h2 className="text-xl font-semibold">Order History</h2>
              </div>
            </div>
            <button 
              className="w-full px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-300 text-white font-medium"
            >
              View All Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
