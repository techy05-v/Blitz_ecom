import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from "../../../components/Navbar/Navbar";
import Footer from '../../../components/Footer/Footer';
import Breadcrumbs from "../../../hooks/Breadcrumbs"

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col"> {/* Added wrapper with flex-1 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs />
        </div>
        
        <main className="flex-1"> {/* Changed from flex-grow to flex-1 */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Layout;