import { 
  Bus, 
  LayoutDashboard, 
  Users, 
  Map, 
  Bell, 
  Settings, 
  Star, 
  Route, 
  CalendarClock, 
  MapPin
} from "lucide-react";
import { UserRole } from "@shared/schema";
import Tour from "@/components/ui/tour";
import { useTour } from "@/hooks/use-tour";

// Tour steps for Administrator
const adminTourSteps = [
  {
    target: '[data-tour="admin-dashboard"]',
    title: "Dashboard",
    content: (
      <div>
        <p>Welcome to TransitPro! As an administrator, your dashboard gives you a quick overview of your transportation network.</p>
        <p className="mt-2 text-sm text-muted-foreground">See active routes, vehicles, and recent activities at a glance.</p>
      </div>
    ),
    icon: LayoutDashboard,
    position: "bottom" as const
  },
  {
    target: '[data-tour="admin-routes"]',
    title: "Route Management",
    content: (
      <div>
        <p>Create, edit, and manage your transportation routes here.</p>
        <p className="mt-2 text-sm text-muted-foreground">Set route details like start/end locations, waypoints and frequency.</p>
      </div>
    ),
    icon: Route,
    position: "right" as const
  },
  {
    target: '[data-tour="admin-vehicles"]',
    title: "Vehicle Management",
    content: (
      <div>
        <p>Manage your vehicle fleet in this section.</p>
        <p className="mt-2 text-sm text-muted-foreground">Add new vehicles, track maintenance schedules, and monitor fuel status.</p>
      </div>
    ),
    icon: Bus,
    position: "right" as const
  },
  {
    target: '[data-tour="admin-drivers"]',
    title: "Driver Management",
    content: (
      <div>
        <p>Manage your drivers and their assignments here.</p>
        <p className="mt-2 text-sm text-muted-foreground">View driver ratings, assign routes, and monitor performance.</p>
      </div>
    ),
    icon: Users,
    position: "right" as const
  },
  {
    target: '[data-tour="admin-assignments"]',
    title: "Assignment Management",
    content: (
      <div>
        <p>Schedule and manage route assignments in this section.</p>
        <p className="mt-2 text-sm text-muted-foreground">Assign drivers to vehicles and routes, and set schedules.</p>
      </div>
    ),
    icon: CalendarClock,
    position: "right" as const
  }
];

// Tour steps for regular users
const userTourSteps = [
  {
    target: '[data-tour="user-routes"]',
    title: "Live Routes",
    content: (
      <div>
        <p>Welcome to TransitPro! This section shows you all active routes in real-time.</p>
        <p className="mt-2 text-sm text-muted-foreground">Track vehicles, see ETAs, and plan your journey efficiently.</p>
      </div>
    ),
    icon: Map,
    position: "bottom" as const
  },
  {
    target: '[data-tour="user-favorite-routes"]',
    title: "Favorite Routes",
    content: (
      <div>
        <p>Save your frequently used routes for quick access.</p>
        <p className="mt-2 text-sm text-muted-foreground">Click the star icon on any route to add it to your favorites.</p>
      </div>
    ),
    icon: Star,
    position: "right" as const
  },
  {
    target: '[data-tour="user-notifications"]',
    title: "Notifications",
    content: (
      <div>
        <p>Stay updated with route changes and delays.</p>
        <p className="mt-2 text-sm text-muted-foreground">Get notified when your favorite routes have updates or schedule changes.</p>
      </div>
    ),
    icon: Bell,
    position: "bottom" as const
  },
  {
    target: '[data-tour="user-ratings"]',
    title: "Driver Ratings",
    content: (
      <div>
        <p>Rate your journey experience and provide feedback.</p>
        <p className="mt-2 text-sm text-muted-foreground">Your ratings help us improve our service and reward good drivers.</p>
      </div>
    ),
    icon: Star,
    position: "bottom" as const
  }
];

// Tour steps for drivers
const driverTourSteps = [
  {
    target: '[data-tour="driver-route"]',
    title: "My Route",
    content: (
      <div>
        <p>Welcome to TransitPro! As a driver, this section shows your current route assignment.</p>
        <p className="mt-2 text-sm text-muted-foreground">View stops, schedules, and navigation instructions here.</p>
      </div>
    ),
    icon: Route,
    position: "bottom" as const
  },
  {
    target: '[data-tour="driver-vehicle"]',
    title: "My Vehicle",
    content: (
      <div>
        <p>Check details about your assigned vehicle.</p>
        <p className="mt-2 text-sm text-muted-foreground">Monitor fuel status, maintenance schedules, and report issues if needed.</p>
      </div>
    ),
    icon: Bus,
    position: "right" as const
  },
  {
    target: '[data-tour="driver-location"]',
    title: "Update Location",
    content: (
      <div>
        <p>Keep your location updated for real-time tracking.</p>
        <p className="mt-2 text-sm text-muted-foreground">This helps passengers know your exact location and estimated arrival time.</p>
      </div>
    ),
    icon: MapPin,
    position: "bottom" as const
  },
  {
    target: '[data-tour="driver-schedule"]',
    title: "My Schedule",
    content: (
      <div>
        <p>View your daily and weekly schedule here.</p>
        <p className="mt-2 text-sm text-muted-foreground">See upcoming assignments and plan your work efficiently.</p>
      </div>
    ),
    icon: CalendarClock,
    position: "right" as const
  },
  {
    target: '[data-tour="driver-settings"]',
    title: "Settings",
    content: (
      <div>
        <p>Customize your driver profile and app preferences.</p>
        <p className="mt-2 text-sm text-muted-foreground">Update your contact information and notification settings here.</p>
      </div>
    ),
    icon: Settings,
    position: "bottom" as const
  }
];

export default function TourGuide() {
  const { showTour, setShowTour, markTourAsCompleted, tourType } = useTour();

  if (!showTour || !tourType) return null;

  const getTourSteps = () => {
    switch (tourType) {
      case 'admin':
        return adminTourSteps;
      case 'user':
        return userTourSteps;
      case 'driver':
        return driverTourSteps;
      default:
        return [];
    }
  };

  return (
    <Tour
      steps={getTourSteps()}
      isOpen={showTour}
      onClose={() => setShowTour(false)}
      onComplete={markTourAsCompleted}
    />
  );
}