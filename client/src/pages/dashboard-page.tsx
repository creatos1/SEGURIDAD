import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import AdminDashboard from "@/components/admin/dashboard";
import RouteManagement from "@/components/admin/route-management";
import DriverManagement from "@/components/admin/driver-management";
import VehicleManagement from "@/components/admin/vehicle-management";
import LiveRoutes from "@/components/user/live-routes";
import DriverRating from "@/components/user/driver-rating";
import MyRoute from "@/components/driver/my-route";
import VehicleInfo from "@/components/driver/vehicle-info";

export default function DashboardPage() {
  const [location, setLocation] = useLocation();
  const { isAdmin, isUser, isDriver } = useAuth();
  const [mainContent, setMainContent] = useState<React.ReactNode | null>(null);
  
  // Match routes
  const [matchesRoot] = useRoute("/");
  const [matchesRoutes] = useRoute("/routes");
  const [matchesDrivers] = useRoute("/drivers");
  const [matchesVehicles] = useRoute("/vehicles");
  const [matchesFavorites] = useRoute("/favorites");
  const [matchesRatings] = useRoute("/ratings");
  const [matchesHistory] = useRoute("/history");
  const [matchesVehicle] = useRoute("/vehicle");
  const [matchesSchedule] = useRoute("/schedule");
  const [matchesMyRatings] = useRoute("/my-ratings");
  
  useEffect(() => {
    // Set default route based on user role if we're at the root
    if (matchesRoot) {
      if (isAdmin) {
        // Admin sees the admin dashboard at root
        setMainContent(<AdminDashboard />);
      } else if (isUser) {
        // User sees the live routes at root
        setMainContent(<LiveRoutes />);
      } else if (isDriver) {
        // Driver sees their route at root
        setMainContent(<MyRoute />);
      }
    } else if (isAdmin) {
      // Admin routes
      if (matchesRoutes) {
        setMainContent(<RouteManagement />);
      } else if (matchesDrivers) {
        setMainContent(<DriverManagement />);
      } else if (matchesVehicles) {
        setMainContent(<VehicleManagement />);
      }
    } else if (isUser) {
      // User routes
      if (matchesRatings) {
        setMainContent(<DriverRating />);
      } else if (matchesFavorites) {
        setMainContent(<LiveRoutes favoritesOnly={true} />);
      } else if (matchesHistory) {
        setMainContent(<LiveRoutes showHistory={true} />);
      }
    } else if (isDriver) {
      // Driver routes
      if (matchesVehicle) {
        setMainContent(<VehicleInfo />);
      } else if (matchesSchedule) {
        setMainContent(<MyRoute showSchedule={true} />);
      } else if (matchesMyRatings) {
        setMainContent(<MyRoute showRatings={true} />);
      }
    }
  }, [
    location, 
    isAdmin, 
    isUser, 
    isDriver, 
    matchesRoot,
    matchesRoutes,
    matchesDrivers,
    matchesVehicles,
    matchesFavorites,
    matchesRatings,
    matchesHistory,
    matchesVehicle,
    matchesSchedule,
    matchesMyRatings
  ]);

  return (
    <div className="h-screen flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-neutral-100">
        {mainContent}
      </main>
    </div>
  );
}
