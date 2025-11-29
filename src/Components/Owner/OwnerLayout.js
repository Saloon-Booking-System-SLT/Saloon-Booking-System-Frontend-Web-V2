import React, { useState } from 'react';
import OwnerSidebar from './OwnerSidebar';
import OwnerHeader from './OwnerHeader';

const OwnerLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <OwnerSidebar 
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen} 
      />
      
      <div className="flex-1 lg:ml-0">
        <OwnerHeader />
        <main className="p-4 md:p-6 lg:p-8 pt-20 lg:pt-6">
          <div className="max-w-full overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;