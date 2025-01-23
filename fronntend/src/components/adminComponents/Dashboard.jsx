import React from 'react';

const StatCard = ({ icon, title, value, change, bgColor }) => (
  <div className={`${bgColor} rounded-xl shadow-lg text-white hover:scale-105 transition-transform duration-200`}>
    <div className="p-6">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-white bg-opacity-25">
          {icon}
        </div>
        <div className="mx-5">
          <h4 className="text-2xl font-bold">{value}</h4>
          <div className="text-white text-opacity-90">{title}</div>
        </div>
      </div>
      <div className="flex items-center mt-4">
        <div className={`text-sm ${change >= 0 ? 'bg-green-500' : 'bg-red-500'} px-2 py-1 rounded-full`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
        </div>
        <div className="text-white text-opacity-75 text-sm ml-2">from last week</div>
      </div>
    </div>
  </div>
);

const RecentOrderRow = ({ order, customer, date, status }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 hover:bg-gray-50 px-4 rounded-lg transition-colors duration-150">
    <div className="flex items-center space-x-4">
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
        {customer[0]}
      </div>
      <div>
        <div className="font-medium">{customer}</div>
        <div className="text-sm text-gray-500">Order #{order}</div>
      </div>
    </div>
    <div className="text-sm text-gray-600">{date}</div>
    <div className={`px-3 py-1 rounded-full text-sm ${
      status === 'Completed' ? 'bg-green-100 text-green-800' :
      status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
      'bg-blue-100 text-blue-800'
    }`}>
      {status}
    </div>
  </div>
);

const TopProductCard = ({ name, sales, trend }) => (
  <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors duration-150">
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-indigo-400 to-cyan-400 flex items-center justify-center text-white">
        {name[0]}
      </div>
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-sm text-gray-500">{sales} sales</div>
      </div>
    </div>
    <div className={`text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
      {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
    </div>
  </div>
);

function Dashboard() {
  const recentOrders = [
    { order: "1234", customer: "Alice Brown", date: "2024-01-20", status: "Completed" },
    { order: "1235", customer: "Bob Smith", date: "2024-01-20", status: "Pending" },
    { order: "1236", customer: "Carol White", date: "2024-01-19", status: "Processing" }
  ];

  const topProducts = [
    { name: "Premium Widget", sales: 1234, trend: 12 },
    { name: "Super Gadget", sales: 923, trend: -5 },
    { name: "Mega Tool", sales: 845, trend: 8 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
          title="Total Orders" 
          value="1,234" 
          change={2.5}
          bgColor="bg-gradient-to-r from-purple-500 to-purple-600"
        />
        <StatCard 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          title="Total Revenue" 
          value="$56,789" 
          change={-1.5}
          bgColor="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        <StatCard 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          title="Total Customers" 
          value="9,876" 
          change={5.2}
          bgColor="bg-gradient-to-r from-green-500 to-green-600"
        />
        <StatCard 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
          title="Total Products" 
          value="543" 
          change={3.1}
          bgColor="bg-gradient-to-r from-pink-500 to-pink-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Recent Orders</h2>
          <div className="space-y-2">
            {recentOrders.map((order, index) => (
              <RecentOrderRow key={index} {...order} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Top Selling Products</h2>
          <div className="space-y-2">
            {topProducts.map((product, index) => (
              <TopProductCard key={index} {...product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;