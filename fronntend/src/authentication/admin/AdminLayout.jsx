import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/adminComponents/Sidebar';
import Header from '../../components/adminComponents/Header';

function AdminLayout() {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar allowedRole = "admin" />
      <div className="flex-1 flex flex-col min-w-0"> {/* added min-w-0 */}
        <Header allowedRole = "admin"/>
        <main 
          className="flex-1 relative bg-slate-50" 
          style={{ height: 'calc(100vh - 64px)' }} // assuming header is 64px
        >
          <div className="absolute inset-0 overflow-y-auto">
            <div className="container mx-auto px-6 py-8 min-h-full">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;