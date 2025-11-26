import React from 'react';
import OwnerSidebar from './OwnerSidebar';
import OwnerHeader from './OwnerHeader';

const OwnerLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <OwnerSidebar />

      {/* Main Content Area */}
      <div className="ml-64">
        {/* Header */}
        <OwnerHeader />

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;