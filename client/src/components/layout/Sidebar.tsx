import { Link, useLocation } from "wouter";
import Logo from "../Logo";
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
  LogOut,
  Building2Icon
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
  { label: "New PICA", href: "/new-pica", icon: <Plus className="w-5 h-5 mr-3" /> },
  { label: "Calendar View", href: "/calendar-pica", icon: <CalendarDays className="w-5 h-5 mr-3" /> },
  { label: "PICA Progress", href: "/pica-progress", icon: <ListTodo className="w-5 h-5 mr-3" /> },
];

const dataSettingItems = [
  { label: "Person", href: "/person-in-charge", icon: <Users className="w-5 h-5 mr-3" /> },
  { label: "Department", href: "/department", icon: <Building2 className="w-5 h-5 mr-3" /> },
  { label: "Project", href: "/project-site", icon: <Building className="w-5 h-5 mr-3" /> },
  { label: "User", href: "/user", icon: <User className="w-5 h-5 mr-3" /> },
];

const Sidebar = () => {
  const [location] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [dataSettingsOpen, setDataSettingsOpen] = useState(true);
  
  // Check if current location is one of the data settings pages
  const isDataSettingsPage = dataSettingItems.some(item => item.href === location);
  
  // Automatically open the data settings dropdown if we're on one of those pages
  useEffect(() => {
    if (isDataSettingsPage && !dataSettingsOpen) {
      setDataSettingsOpen(true);
    }
  }, [isDataSettingsPage, dataSettingsOpen]);

  // Handle logout
  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-slate-900 text-white">
        <div className="flex h-20 items-center px-6 border-b border-slate-800">
          <Logo />
        </div>

        <div className="overflow-y-auto flex-1">
          <nav className="flex-1 mt-6 px-4 space-y-1">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "group flex items-center px-4 py-3 text-sm rounded-lg transition-all duration-150 ease-in-out cursor-pointer",
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
                      <div
                        className={cn(
                          "group flex items-center px-4 py-2.5 text-sm rounded-lg transition-all duration-150 ease-in-out cursor-pointer",
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
        
        <div className="border-t border-slate-800">
          {/* User Profile Section */}
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full text-left p-4 text-sm text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <UserCircle className="w-5 h-5 mr-3" />
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-slate-400">{user.username}</span>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 z-50" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center">
                  <Building2Icon className="w-4 h-4 mr-2" />
                  <span className="text-sm truncate">Organization: {user.organizationName || `ID: ${user.organizationId || "N/A"}`}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  <span>Role: {user.role || "User"}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center text-destructive cursor-pointer" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth">
              <div className="p-4 text-sm text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer">
                <div className="flex items-center">
                  <UserCircle className="w-5 h-5 mr-3" />
                  <span>Sign In</span>
                </div>
              </div>
            </Link>
          )}
          <div className="px-4 py-2 text-xs text-slate-500 text-center">
            PICA Monitor v1.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
