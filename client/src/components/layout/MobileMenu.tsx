import { useState } from "react";
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

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between">
        <Logo />
        <button onClick={toggleMenu} className="text-white p-2 rounded-lg hover:bg-slate-800">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900 overflow-y-auto">
          <div className="flex justify-between items-center p-4 border-b border-slate-800">
            <Logo />
            <button onClick={toggleMenu} className="text-white p-2 rounded-lg hover:bg-slate-800">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="px-4 py-6 space-y-3">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a
                  onClick={toggleMenu}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm rounded-lg transition-all duration-150 ease-in-out",
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

            <div className="mt-6 mb-2">
              <button 
                onClick={() => setDataSettingsOpen(!dataSettingsOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-150 ease-in-out"
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
                <div className="ml-4 mt-1 space-y-1 border-l border-slate-800 pl-4">
                  {dataSettingItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <a
                        onClick={toggleMenu}
                        className={cn(
                          "flex items-center px-4 py-2.5 text-sm rounded-lg transition-all duration-150 ease-in-out",
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
          
          <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
            <div className="flex items-center justify-center">
              PICA Monitor v1.0
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileMenu;
