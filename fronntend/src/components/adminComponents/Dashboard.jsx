import React from 'react';
import { FaShoppingCart, FaUsers, FaBox, FaDollarSign } from 'react-icons/fa';

const StatCard = ({ icon, title, value, change }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex items-center">
      <div className="p-3 rounded-full bg-indigo-600 bg-opacity-75">
        {icon}
      </div>
      <div className="mx-5">
        <h4 className="text-2xl font-semibold text-gray-700">{value}</h4>
        <div className="text-gray-500">{title}</div>
      </div>
    </div>
    <div className="flex items-center mt-4">
      <div className={`text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
      </div>
      <div className="text-gray-500 text-sm ml-2">from last week</div>
    </div>
  </div>
);

function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard icon={<FaShoppingCart className="h-8 w-8 text-white" />} title="Total Orders" value="1,234" change={2.5} />
        <StatCard icon={<FaDollarSign className="h-8 w-8 text-white" />} title="Total Revenue" value="$56,789" change={-1.5} />
        <StatCard icon={<FaUsers className="h-8 w-8 text-white" />} title="Total Customers" value="9,876" change={5.2} />
        <StatCard icon={<FaBox className="h-8 w-8 text-white" />} title="Total Products" value="543" change={3.1} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
          {/* Add a table or list of recent orders here */}
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Top Selling Products</h2>
          {/* Add a list or chart of top selling products here */}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
