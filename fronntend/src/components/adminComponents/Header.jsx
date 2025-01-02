import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toggleSidebar } from '../../redux/slice/sidebarSlice';
import { adminLogout } from '../../redux/slice/AdminSlice'; // Import the logout action
import { FaBars, FaBell, FaSearch } from 'react-icons/fa';
import cookies from "js-cookie"
function Header() {
  const location = useLocation();
  const navigate = useNavigate();  // Initialize navigate for redirecting
  const dispatch = useDispatch();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname.substring(1); // Remove leading slash
    return path.charAt(0).toUpperCase() + path.slice(1); // Capitalize first letter
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest(".dropdown")) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  // Handle logout functionality
  const handleLogout = async() => {
    // dispatch(adminLogout());  // Dispatch the logout action to clear the Redux store
    
       cookies.remove('adminRefreshToken')
       cookies.remove('admin_access_token'); 
        // Remove token from localStorage (if it's stored there)
        
       navigate('/admin/login');  // Redirect to login page
  };

  return (
    <header className="bg-slate-900 shadow-md py-4 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="text-gray-500 focus:outline-none lg:hidden"
          >
            <FaBars className="h-6 w-6" />
          </button>
          <h1 className="ml-4 text-xl font-semibold text-gray-800">{getPageTitle()}</h1>
        </div>

        <div className="flex items-center">
          <div className="relative mx-4 lg:mx-0">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <FaSearch className="h-5 w-5 text-gray-500" />
            </span>
            <input
              className="form-input w-32 sm:w-64 rounded-md pl-10 pr-4 focus:border-indigo-600"
              type="text"
              placeholder="Search"
            />
          </div>

          <button className="flex mx-4 text-yellow-400 focus:outline-none">
            <FaBell className="h-6 w-6" />
            <span className="absolute top-0 right-0 h-2 w-2 mt-1 mr-2 bg-red-500 rounded-full"></span>
            <span className="absolute top-0 right-0 h-2 w-2 mt-1 mr-2 bg-red-500 rounded-full animate-ping"></span>
          </button>

          <div className="relative dropdown">
            <button
              className="relative z-10 block h-8 w-8 rounded-full overflow-hidden border-2 border-gray-600 focus:outline-none focus:border-white"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <img
                className="h-full w-full object-cover"
                src=""
                alt="Your avatar"
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-xl z-20">
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-600 hover:text-white"
                >
                  Profile
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-600 hover:text-white"
                >
                  Settings
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-600 hover:text-white"
                  onClick={handleLogout}  // Call the handleLogout function on click
                >
                  Logout
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
