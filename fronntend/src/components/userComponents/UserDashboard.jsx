import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Wallet, MapPin, User, Truck, Clock, ChevronRight } from 'lucide-react';

const Card = ({ children, className }) => (
  <div className={`rounded-lg shadow-md p-6 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, className, variant = 'primary' }) => {
  const baseClasses = 'px-4 py-2 rounded font-semibold transition-colors duration-300';
  const variantClasses = {
    primary: 'bg-white text-gray-800 hover:bg-gray-100',
    ghost: 'text-white hover:bg-white hover:bg-opacity-20',
    outline: 'border border-white text-white hover:bg-white hover:text-gray-800',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, variant = 'primary' }) => {
  const variantClasses = {
    primary: 'bg-white text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

const UserDashboard = () => {
  const navigate = useNavigate();

  const dashboardItems = [
    { title: 'Shopping Cart', icon: ShoppingCart, content: '', link: '/user/cart', color: 'bg-pink-500' },
    { title: 'Wishlist', icon: Heart, content: '', link: '/user/wishlist', color: 'bg-purple-500' },
    { title: 'Wallet', icon: Wallet, content: 'Balance: ₹250.00', link: '/user/wallet', color: 'bg-green-500' },
    { title: 'Address', icon: MapPin, content: '', link: '/user/address', color: 'bg-yellow-500' },
    { title: 'Account Details', icon: User, content: '', link: '/user/account', color: 'bg-blue-500' },
  ];

  const orders = [
    { id: '#12345', date: '2023-06-15', total: '$120.00', status: 'Delivered' },
    { id: '#12346', date: '2023-06-10', total: '$85.50', status: 'In Transit' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-gray-900">My Account</h1>
          <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-semibold">
            JD
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-indigo-600 text-white col-span-full">
            <h2 className="text-xl font-semibold mb-2">Dashboard</h2>
          </Card>
          
          {dashboardItems.map((item, index) => (
            <Card key={index} className={`${item.color} text-white`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <item.icon className="h-5 w-5" />
              </div>
              <p className="mb-4">{item.content}</p>
              <Link to={item.link} className="text-white hover:underline flex items-center">
                View Details
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Card>
          ))}
          
          <Card className="bg-orange-500 text-white">
            <div className="flex items-center mb-4">
              <Clock className="mr-2" size={20} />
              <h2 className="text-xl font-semibold">Order History</h2>
            </div>
            <div className="mt-4">
              <Button variant="outline" onClick={() => navigate('/user/orders')}>View All Orders</Button>
            </div>
          </Card>
          
          <Card className="bg-teal-500 text-white">
            <div className="flex items-center mb-4">
              <Truck className="mr-2" size={20} />
              <h2 className="text-xl font-semibold">Track Order</h2>
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Enter Order ID"
                className="flex-grow p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-300 text-gray-800"
              />
              <Button onClick={() => navigate('/user/track')}>Track</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;

