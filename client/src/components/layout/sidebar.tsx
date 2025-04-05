import { useState, ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Home, 
  LayoutDashboard, 
  Map, 
  Car, 
  Users, 
  Route, 
  Star, 
  History, 
  Navigation, 
  Bus, 
  Calendar, 
  BarChart, 
  LogOut,
  Menu,
  X,
  Settings
} from "lucide-react";

type NavItemProps = {
  href: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick?: () => void;
};

function NavItem({ href, label, icon, active, onClick }: NavItemProps) {
  const [_, navigate] = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) onClick();
    navigate(href);
  };

  return (
    <button 
      className={cn(
        "flex items-center px-4 py-2 hover:bg-neutral-100 transition-colors cursor-pointer w-full text-left",
        active ? "text-primary font-medium" : "text-neutral-400"
      )}
      onClick={handleClick}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </button>
  );
}

export default function Sidebar() {
  const [location] = useLocation();
  const { user, isAdmin, isUser, isDriver, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Define role color
  const roleColor = isAdmin 
    ? "bg-[#3f51b5]" // admin color
    : isUser 
      ? "bg-[#4caf50]" // user color
      : "bg-[#ff9800]"; // driver color

  // Get role label
  const roleLabel = isAdmin ? "Administrator" : isUser ? "User" : "Driver";

  return (
    <aside className="w-full md:w-64 bg-white shadow-md flex-shrink-0">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          <span className={`h-3 w-3 rounded-full mr-2 ${roleColor}`}></span>
          <h1 className="text-xl font-bold text-primary">TransitPro</h1>
        </div>
        <button 
          className="md:hidden text-neutral-400"
          onClick={toggleMobileMenu}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className={cn(
        "md:block", 
        isMobileMenuOpen ? "block" : "hidden"
      )}>
        <div className="p-4 border-b">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center">
              <Users className="text-neutral-400" size={20} />
            </div>
            <div className="ml-3">
              <p className="font-medium text-neutral-400">{user?.fullName || user?.username}</p>
              <p className="text-sm text-neutral-300">{roleLabel}</p>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-130px)]">
          {/* Admin Navigation */}
          {isAdmin && (
            <div className="py-2">
              <p className="px-4 text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                Administration
              </p>
              <nav>
                <div>
                  <NavItem 
                    href="/" 
                    label="Home" 
                    icon={<Home size={18} />} 
                    active={location === '/'} 
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                </div>
                <div data-tour="admin-dashboard">
                  <NavItem 
                    href="/" 
                    label="Dashboard" 
                    icon={<LayoutDashboard size={18} />} 
                    active={location === '/'} 
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                </div>
                <div data-tour="admin-routes">
                  <NavItem 
                    href="/routes" 
                    label="Routes" 
                    icon={<Route size={18} />} 
                    active={location.startsWith('/routes')} 
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                </div>
                <div data-tour="admin-drivers">
                  <NavItem 
                    href="/drivers" 
                    label="Drivers" 
                    icon={<Car size={18} />} 
                    active={location.startsWith('/drivers')} 
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                </div>
                <div data-tour="admin-vehicles">
                  <NavItem 
                    href="/vehicles" 
                    label="Vehicles" 
                    icon={<Bus size={18} />} 
                    active={location.startsWith('/vehicles')} 
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                </div>
                <div data-tour="admin-assignments">
                  <NavItem 
                    href="/reports" 
                    label="Reports" 
                    icon={<BarChart size={18} />} 
                    active={location.startsWith('/reports')} 
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                </div>
              </nav>
            </div>
          )}

          {/* User Navigation */}
          {isUser && (
            <div className="py-2">
              <p className="px-4 text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                User Menu
              </p>
              <nav>
                <div>
                  <NavItem 
                    href="/" 
                    label="Home" 
                    icon={<Home size={18} />} 
                    active={location === '/'} 
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                </div>
                <div data-tour="user-routes">
                  <NavItem 
                    href="/" 
                    label="Live Routes" 
                    icon={<Map size={18} />} 
                    active={location === '/'} 
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                </div>
                <div data-tour="user-favorite-routes">
                  <NavItem 
                    href="/favorites" 
                    label="Favorites" 
                    icon={<Star size={18} />} 
                    active={location.startsWith('/favorites')} 
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                </div>
                <div data-tour="user-ratings">
                  <NavItem 
                    href="/ratings" 
                    label="My Ratings" 
                    icon={<Star size={18} />} 
                    active={location.startsWith('/ratings')} 
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                </div>
                <div data-tour="user-history">
                  <NavItem 
                    href="/history" 
                    label="History" 
                    icon={<History size={18} />} 
                    active={location.startsWith('/history')} 
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                </div>
              </nav>
            </div>
          )}

          {/* Driver Navigation */}
          {isDriver && (
            <div className="py-2">
              <p className="px-4 text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                Driver Menu
              </p>
              <nav>
                <div>
                  <NavItem 
                    href="/" 
                    label="Home" 
                    icon={<Home size={18} />} 
                    active={location === '/'} 
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                </div>
                <div data-tour="driver-route">
                  <NavItem 
                    href="/" 
                    label="My Route" 
                    icon={<Navigation size={18} />} 
                    active={location === '/'} 
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                </div>
                <div data-tour="driver-vehicle">
                  <NavItem 
                    href="/vehicle" 
                    label="My Vehicle" 
                    icon={<Bus size={18} />} 
                    active={location.startsWith('/vehicle')} 
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                </div>
                <div data-tour="driver-schedule">
                  <NavItem 
                    href="/schedule" 
                    label="Schedule" 
                    icon={<Calendar size={18} />} 
                    active={location.startsWith('/schedule')} 
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                </div>
                <div data-tour="driver-ratings">
                  <NavItem 
                    href="/my-ratings" 
                    label="My Ratings" 
                    icon={<Star size={18} />} 
                    active={location.startsWith('/my-ratings')} 
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                </div>
              </nav>
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t mt-auto">
          <div className="mb-2" data-tour="driver-settings">
            <NavItem 
              href="/settings" 
              label="Settings" 
              icon={<Settings size={18} />} 
              active={location.startsWith('/settings')} 
              onClick={() => setIsMobileMenuOpen(false)}
            />
          </div>
          <Button 
            variant="ghost" 
            className="flex items-center w-full justify-start text-neutral-400 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="mr-2" size={18} />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
}