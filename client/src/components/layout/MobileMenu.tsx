import { useState } from "react";
import { Link, useLocation } from "wouter";
import Logo from "../Logo";
import { X, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "DASHBOARD", href: "/dashboard" },
  { label: "NEW PICA", href: "/new-pica" },
  { label: "CALENDAR PICA", href: "/calendar-pica" },
  { label: "PICA PROGRESS", href: "/pica-progress" },
];

const dataSettingItems = [
  { label: "PERSON IN CHARGE", href: "/person-in-charge" },
  { label: "DEPARTMENT", href: "/department" },
  { label: "PROJECT SITE", href: "/project-site" },
];

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-black text-white p-4 flex items-center justify-between">
        <Logo />
        <button onClick={toggleMenu} className="text-white">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-90">
          <div className="flex justify-end p-4">
            <button onClick={toggleMenu} className="text-white">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="px-4 py-2 space-y-2">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a
                  onClick={toggleMenu}
                  className={cn(
                    "block px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 rounded-md",
                    (location === item.href || (item.href === "/dashboard" && location === "/")) &&
                      "bg-gray-700"
                  )}
                >
                  {item.label}
                </a>
              </Link>
            ))}

            <div className="pt-4 px-4 text-sm font-medium text-gray-400">
              DATA SETTING
            </div>

            {dataSettingItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a
                  onClick={toggleMenu}
                  className={cn(
                    "block px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 rounded-md",
                    location === item.href && "bg-gray-700"
                  )}
                >
                  {item.label}
                </a>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
};

export default MobileMenu;
