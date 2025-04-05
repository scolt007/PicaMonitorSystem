import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import Logo from "../Logo";
import { X, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Plus,
  ListTodo,
  Users,
  Building2,
  Building,
  Settings,
  ChevronDown,
  ChevronRight
} from "lucide-react";

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
  { label: "New PICA", href: "/new-pica", icon: <Plus className="w-5 h-5 mr-3" /> },
  { label: "Calendar View", href: "/calendar-pica", icon: <CalendarDays className="w-5 h-5 mr-3" /> },
  { label: "PICA Progress", href: "/pica-progress", icon: <ListTodo className="w-5 h-5 mr-3" /> },
];

const dataSettingItems = [
  { label: "Person In Charge", href: "/person-in-charge", icon: <Users className="w-5 h-5 mr-3" /> },
  { label: "Department", href: "/department", icon: <Building2 className="w-5 h-5 mr-3" /> },
  { label: "Project Site", href: "/project-site", icon: <Building className="w-5 h-5 mr-3" /> },
];

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dataSettingsOpen, setDataSettingsOpen] = useState(false);
  const [location] = useLocation();

  // Check if current location is one of the data settings pages
  const isDataSettingsPage = dataSettingItems.some(item => item.href === location);
  
  // Automatically open the data settings dropdown if we're on one of those pages
  if (isDataSettingsPage && !dataSettingsOpen && isOpen) {
    setDataSettingsOpen(true);
  }

  // Close sidebar on link navigation
  const closeMenu = () => {
    setIsOpen(false);
  };

  // Close the menu when user clicks outside of it
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isOpen && !(e.target as Element).closest('.mobile-menu') && 
          !(e.target as Element).closest('.mobile-menu-button')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Prevent body scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger Button - Always visible on mobile */}
      <div className="fixed top-3 left-3 z-50 md:hidden">
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="mobile-menu-button bg-slate-900 text-white p-2 rounded-lg shadow-lg hover:bg-slate-800 transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Overlay when menu is open */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={closeMenu}></div>
      )}

      {/* Mobile Sidebar */}
      <div 
        className={`fixed md:hidden top-0 left-0 h-full bg-slate-900 text-white z-50 mobile-menu transition-all duration-300 ease-in-out shadow-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '250px' }}
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <Logo />
          <button onClick={closeMenu} className="text-white p-2 rounded-lg hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(100vh-4rem)]">
          <nav className="px-2 py-4 space-y-1">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a
                  onClick={closeMenu}
                  className={cn(
                    "flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-150 ease-in-out",
                    (location === item.href || (item.href === "/dashboard" && location === "/"))
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  )}
                >
                  {item.icon}
                  {item.label}
                </a>
              </Link>
            ))}

            <div className="mt-4">
              <button 
                onClick={() => setDataSettingsOpen(!dataSettingsOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-150 ease-in-out"
              >
                <div className="flex items-center">
                  <Settings className="w-5 h-5 mr-3" />
                  <span>Data Settings</span>
                </div>
                {dataSettingsOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {dataSettingsOpen && (
                <div className="ml-3 mt-1 space-y-1 border-l border-slate-800 pl-3">
                  {dataSettingItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <a
                        onClick={closeMenu}
                        className={cn(
                          "flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-150 ease-in-out",
                          location === item.href
                            ? "bg-primary/10 text-primary font-medium" 
                            : "text-slate-300 hover:text-white hover:bg-slate-800"
                        )}
                      >
                        {item.icon}
                        {item.label}
                      </a>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>
        
        <div className="absolute bottom-0 w-full p-3 border-t border-slate-800 text-xs text-slate-500">
          <div className="flex items-center justify-center">
            PICA Monitor v1.0
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
