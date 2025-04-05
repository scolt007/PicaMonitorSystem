import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import MobileMenu from "./MobileMenu";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Only render desktop sidebar on non-mobile devices */}
      {!isMobile && <Sidebar />}
      
      {/* Mobile hamburger menu and sidebar - only for mobile */}
      <MobileMenu />

      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gray-100 px-4 py-4 md:px-6 lg:px-8 md:pt-4 pt-12">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
