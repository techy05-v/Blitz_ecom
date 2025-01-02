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
    <li className="mb-2">
      <Link
        to={to}
        className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${
          isActive 
            ? 'bg-blue-700 text-white' 
            : 'text-blue-100 hover:bg-blue-700 hover:text-white'
        }`}
      >
        {React.cloneElement(icon, { className: `w-5 h-5 ${isActive ? 'text-white' : 'text-blue-300'}` })}
        <span className="ml-3 text-sm font-medium">{text}</span>
      </Link>
    </li>
  );
};

function Sidebar() {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.sidebar.isOpen);

  return (
    <div 
      className={`bg-slate-900 to-black-200 h-screen fixed lg:static w-64 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 z-30 shadow-xl`}
    >
      <div className="flex items-center justify-between h-16 px-6 border-b border-black">
        <span className="text-2xl font-bold text-white">BLITZ Admin</span>
        <button 
          onClick={() => dispatch(toggleSidebar())}
          className="lg:hidden text-white hover:text-blue-200 transition-colors duration-200"
        >
          <FaTimes className="w-6 h-6" />
        </button>
      </div>
      <nav className="mt-6">
        <ul className="px-4">
          <SidebarItem icon={<FaTachometerAlt />} text="Dashboard" to="/admin/dashboard" />
          <SidebarItem icon={<FaBox />} text="Category" to="/admin/category" />
          <SidebarItem icon={<FaTag />} text="Product" to="/admin/products" />
          <SidebarItem icon={<FaGift />} text="Offer Products" to="/admin/offer-products" />
          <SidebarItem icon={<FaUsers />} text="Customers" to="/admin/customers" />
          <SidebarItem icon={<FaClipboardList />} text="Orders" to="/admin/orders" />
          <SidebarItem icon={<FaImage />} text="Banner" to="/admin/banner" />
          <SidebarItem icon={<FaTicketAlt />} text="Coupon" to="/admin/coupon" />
          <SidebarItem icon={<FaCog />} text="Settings" to="/admin/settings" />
          <li className="mb-2">
            <button 
              onClick={() => console.log('Logout clicked')} 
              className="flex items-center w-full p-3 text-blue-100 hover:bg-blue-700 hover:text-white rounded-lg transition-colors duration-200"
            >
              <FaSignOutAlt className="w-5 h-5 text-blue-300" />
              <span className="ml-3 text-sm font-medium">Logout</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;

