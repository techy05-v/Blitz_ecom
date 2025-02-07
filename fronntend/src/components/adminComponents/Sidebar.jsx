import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FaBox, FaTag, FaGift, FaUsers, FaClipboardList,
  FaImage, FaTicketAlt, FaCog, FaSignOutAlt, FaTachometerAlt,
  FaTimes
} from 'react-icons/fa';
import { toggleSidebar } from '../../redux/slice/sidebarSlice';

const SidebarItem = ({ icon, text, to }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <li className="mb-1">
      <Link
        to={to}
        className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 group relative
          ${isActive
            ? 'bg-white/10 text-white'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
      >
        {React.cloneElement(icon, {
          className: `w-5 h-5 transition-all duration-200
            ${isActive ? 'text-indigo-400' : 'text-gray-400 group-hover:text-indigo-400'}`
        })}
        <span className="ml-3 text-sm font-medium">{text}</span>
        {isActive && (
          <span className="absolute right-4 h-1.5 w-1.5 rounded-full bg-indigo-400" />
        )}
      </Link>
    </li>
  );
};

function Sidebar() {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.sidebar.isOpen);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 lg:hidden z-20"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}
      
      <aside
        className={`bg-slate-900 fixed lg:static w-72 transition-all duration-200 ease-out 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 z-30 h-screen flex flex-col`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-indigo-500 rounded flex items-center justify-center">
              <span className="text-white font-bold">B</span>
            </div>
            <h1 className="text-white font-semibold text-lg">BLITZ Admin</h1>
          </div>
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-white/5 text-gray-300 text-sm rounded-lg pl-4 pr-10 py-2.5 
                outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-200"
            />
            <svg 
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-6">
          <div className="px-3">
            <ul className="space-y-1">
              <SidebarItem icon={<FaTachometerAlt />} text="Dashboard" to="/admin/dashboard" />
              <SidebarItem icon={<FaBox />} text="Category" to="/admin/category" />
              <SidebarItem icon={<FaTag />} text="Product" to="/admin/products" />
              <SidebarItem icon={<FaGift />} text="Offer Products" to="/admin/offer-products" />
              <SidebarItem icon={<FaUsers />} text="Customers" to="/admin/customers" />
              <SidebarItem icon={<FaClipboardList />} text="Orders" to="/admin/orders" />
              <SidebarItem icon={<FaImage />} text="Banner" to="/admin/banner" />
              <SidebarItem icon={<FaTicketAlt />} text="Coupon" to="/admin/coupon" />
              <SidebarItem icon={<FaCog />} text="SalesReport" to="/admin/settings" />
            </ul>
          </div>
        </nav>

        {/* User Profile & Logout */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center p-2 rounded-lg hover:bg-white/5 transition-colors duration-200">
            <img 
              src="/api/placeholder/32/32"
              alt="User"
              className="w-8 h-8 rounded-full bg-indigo-500"
            />
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-gray-400">admin@blitz.com</p>
            </div>
          </div>
          
          <button
            onClick={() => console.log('Logout clicked')}
            className="mt-3 flex items-center w-full px-4 py-2.5 rounded-lg text-gray-400 
              hover:bg-white/5 hover:text-white transition-all duration-200"
          >
            <FaSignOutAlt className="w-5 h-5" />
            <span className="ml-3 text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;