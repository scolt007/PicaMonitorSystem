import { Link, useLocation } from "wouter";
import Logo from "../Logo";
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

const Sidebar = () => {
  const [location] = useLocation();

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-black text-white">
        <div className="flex h-20 items-center px-4">
          <Logo />
        </div>

        <div className="px-4 py-2 text-sm font-medium">MONITORING</div>

        <nav className="flex-1 mt-2 px-2 space-y-2">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "group flex items-center px-4 py-3 text-sm font-medium rounded-md text-white hover:bg-gray-600",
                  (location === item.href || (item.href === "/dashboard" && location === "/")) &&
                    "bg-gray-700"
                )}
              >
                {item.label}
              </a>
            </Link>
          ))}

          <div className="pt-4 px-4 text-sm font-medium">DATA SETTING</div>

          {dataSettingItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "group flex items-center px-4 py-3 text-sm font-medium rounded-md text-white hover:bg-gray-600",
                  location === item.href && "bg-gray-700"
                )}
              >
                {item.label}
              </a>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
