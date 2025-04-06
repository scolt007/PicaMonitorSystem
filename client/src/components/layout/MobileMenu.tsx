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
  ChevronRight,
  User,
  UserCircle,
  LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
  { label: "New PICA", href: "/new-pica", icon: <Plus className="w-5 h-5 mr-3" /> },
  { label: "Calendar View", href: "/calendar-pica", icon: <CalendarDays className="w-5 h-5 mr-3" /> },
  { label: "PICA Progress", href: "/pica-progress", icon: <ListTodo className="w-5 h-5 mr-3" /> },
];

const dataSettingItems = [
  { label: "Person", href: "/person-in-charge", icon: <Users className="w-5 h-5 mr-3" /> },
  { label: "People", href: "/people", icon: <Users className="w-5 h-5 mr-3" /> },
  { label: "Department", href: "/department", icon: <Building2 className="w-5 h-5 mr-3" /> },
  { label: "Job", href: "/project-job", icon: <Building className="w-5 h-5 mr-3" /> },
  { label: "User", href: "/user", icon: <User className="w-5 h-5 mr-3" /> },
];

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dataSettingsOpen, setDataSettingsOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  // Check if current location is one of the data settings pages
  const isDataSettingsPage = dataSettingItems.some(item => item.href === location);
  
  // Automatically open the data settings dropdown if we're on one of those pages
  useEffect(() => {
    if (isDataSettingsPage && !dataSettingsOpen && isOpen) {
      setDataSettingsOpen(true);
    }
  }, [isDataSettingsPage, dataSettingsOpen, isOpen]);

  // Close sidebar on link navigation
  const closeMenu = () => {
    setIsOpen(false);
  };

  // Handle logout
  const handleLogout = () => {
    logout.mutate();
    closeMenu();
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
        style={{ width: '280px' }}
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <Logo />
          <button onClick={closeMenu} className="text-white p-2 rounded-lg hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto h-[calc(100vh-8rem)]">
          <nav className="px-2 py-4 space-y-1">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  onClick={closeMenu}
                  className={cn(
                    "flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-150 ease-in-out cursor-pointer",
                    (location === item.href || (item.href === "/dashboard" && location === "/"))
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  )}
                >
                  {item.icon}
                  {item.label}
                </div>
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
                      <div
                        onClick={closeMenu}
                        className={cn(
                          "flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-150 ease-in-out cursor-pointer",
                          location === item.href
                            ? "bg-primary/10 text-primary font-medium" 
                            : "text-slate-300 hover:text-white hover:bg-slate-800"
                        )}
                      >
                        {item.icon}
                        {item.label}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>
        
        <div className="absolute bottom-0 w-full border-t border-slate-800">
          {/* User Profile Section */}
          {isAuthenticated && user ? (
            <div>
              <button 
                className="w-full text-left p-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer flex items-center justify-between"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="flex items-center">
                  <UserCircle className="w-5 h-5 mr-3" />
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-slate-400">{user.username}</span>
                  </div>
                </div>
                {userMenuOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              
              {userMenuOpen && (
                <div className="bg-slate-800 p-3 border-t border-slate-700">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center px-2 py-1 text-sm text-slate-300">
                      <Building2 className="w-4 h-4 mr-3 flex-shrink-0" />
                      <span className="break-words">{user.organizationName || `Organization ID: ${user.organizationId || "N/A"}`}</span>
                    </div>
                    <div className="flex items-center px-2 py-1 text-sm text-slate-300">
                      <User className="w-4 h-4 mr-3 flex-shrink-0" />
                      <span>Role: {user.role || "User"}</span>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center mt-2 px-2 py-1.5 text-sm text-red-400 hover:bg-slate-700 rounded w-full"
                    >
                      <LogOut className="w-4 h-4 mr-3 flex-shrink-0" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth">
              <div className="p-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer" onClick={closeMenu}>
                <div className="flex items-center">
                  <UserCircle className="w-5 h-5 mr-3" />
                  <span>Sign In</span>
                </div>
              </div>
            </Link>
          )}
          <div className="px-3 py-2 text-xs text-slate-500 text-center">
            PICA Monitor v1.0
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
