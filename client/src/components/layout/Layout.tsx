import React from "react";
import Sidebar from "./Sidebar";
import MobileMenu from "./MobileMenu";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop sidebar */}
      <Sidebar />
      
      {/* Mobile hamburger menu and sidebar */}
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
