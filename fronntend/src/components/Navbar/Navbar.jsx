import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { userLogout } from "../../redux/slice/UserSlice";
import Cookies from "js-cookie";
import { Search, User, Heart, ShoppingCart, LogOut, Menu, X, Triangle } from 'lucide-react';

const NavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`${
        isActive ? "text-cyan-400" : "text-white"
      } hover:text-cyan-400 px-3 py-2 text-sm font-medium transition-colors duration-300`}
    >
      {children}
    </Link>
  );
};

const Navbar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartQuantity = useSelector(state => state.cart.totalQuantity);

  const handleLogout = () => {
    dispatch(userLogout());
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    navigate("/user/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/user/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  const navLinks = [
    { path: "/user/home", label: "Home" },
    { path: "/user/shop", label: "Shop" },
    { path: "/user/about", label: "About" },
    { path: "/user/contact", label: "Contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md shadow-lg border-b border-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center">
              <Triangle className="h-8 w-8 text-cyan-400 hover:text-cyan-300 transition duration-300" />
              <span className="ml-2 text-2xl font-bold text-white hover:text-cyan-400 transition duration-300">
                BLITZ
              </span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white hover:text-cyan-400 transition duration-300"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className="flex space-x-8">
              {navLinks.map((link) => (
                <NavLink key={link.path} to={link.path}>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right Icons */}
          <div className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="text-white hover:text-cyan-400 transition duration-300"
              aria-label="Search"
            >
              <Search className="h-6 w-6" />
            </button>

            <NavIconLink to="/user/dashboard" ariaLabel="Dashboard">
              <User className="h-6 w-6" />
            </NavIconLink>

            <NavIconLink to="/user/wishlist" ariaLabel="Wishlist">
              <Heart className="h-6 w-6" />
            </NavIconLink>

            <NavIconLink to="/user/cart" ariaLabel="Cart" className="relative">
              <ShoppingCart className="h-6 w-6" />
              {cartQuantity > 0 && (
                <span className="absolute -top-2 -right-2 bg-cyan-400 text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartQuantity}
                </span>
              )}
            </NavIconLink>

            <button
              onClick={handleLogout}
              className="text-white hover:text-cyan-400 transition duration-300"
              aria-label="Logout"
            >
              <LogOut className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-gray-800 bg-opacity-75 py-4">
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block text-white hover:text-cyan-400 px-4 py-2 text-sm font-medium transition-colors duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="py-4 bg-gray-800 bg-opacity-75">
            <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-4 pr-10 py-2 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-400 bg-gray-900 text-white"
              />
              <button
                type="submit"
                className="absolute right-3 top-2.5 text-gray-400 hover:text-cyan-400"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
};

const NavIconLink = ({ to, ariaLabel, children, className }) => (
  <Link
    to={to}
    className={`text-white hover:text-cyan-400 transition duration-300 ${className || ''}`}
    aria-label={ariaLabel}
  >
    {children}
  </Link>
);

export default Navbar;