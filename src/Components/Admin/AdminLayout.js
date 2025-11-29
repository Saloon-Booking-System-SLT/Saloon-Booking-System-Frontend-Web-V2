import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const AdminLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar 
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen} 
      />

      {/* Main Content Area */}
      <div className="lg:ml-64 transition-all duration-300">
        {/* Header */}
        <AdminHeader />

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8 pt-20 lg:pt-6">
          <div className="max-w-full overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;