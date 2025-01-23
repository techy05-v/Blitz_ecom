import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const pathMap = {
  home: 'Home',
  shop: 'Shop',
  product: 'Product',
  dashboard: 'Dashboard',
  cart: 'Shopping Cart',
  wishlist: 'Wishlist',
  wallet: 'Wallet',
  address: 'Address',
  account: 'Account Details',
  orders: 'Order History',
  track: 'Track Order',
};

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <Link to="/user/home" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
            Home
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/user/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;

          return (
            <li key={to}>
              <div className="flex items-center">
                <ChevronRight className="w-5 h-5 text-gray-400" />
                <Link
                  to={to}
                  className={`ml-1 text-sm font-medium ${
                    isLast ? 'text-gray-500' : 'text-gray-700 hover:text-blue-600'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {pathMap[value] || value}
                </Link>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;


