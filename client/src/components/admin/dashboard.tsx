import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Route as RouteIcon, Edit, Trash2, User, UserPlus, Car } from "lucide-react";
import Header from "@/components/layout/header";
import LeafletMap from "@/lib/leaflet-map";


type StatsData = {
  activeRoutesCount: number;
  activeVehiclesCount: number;
  driversCount: number;
  usersCount: number;
};

type RouteData = {
  id: number;
  name: string;
  status: string;
  vehicleCount: number;
};

type DriverData = {
  id: number;
  fullName: string;
  route: string;
  rating: number;
};

type ActivityItem = {
  id: number;
  type: string;
  message: string;
  timestamp: string;
};

export default function AdminDashboard() {
  const { isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const { subscribe, lastMessage } = useWebSocket();
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Query for statistics
  const { data: stats, isLoading: isStatsLoading } = useQuery<StatsData>({
    queryKey: ['/api/stats'],
  });

  // Query for routes
  const { data: routes, isLoading: isRoutesLoading } = useQuery<RouteData[]>({
    queryKey: ['/api/routes'],
    select: (data) => {
      return data.map(route => ({
        id: route.id,
        name: route.name,
        status: route.status,
        vehicleCount: 0
      })).slice(0, 5);
    }
  });

  // Query for drivers
  const { data: drivers, isLoading: isDriversLoading } = useQuery<DriverData[]>({
    queryKey: ['/api/users', { role: 'driver' }],
    select: (data) => {
      return data.map(driver => ({
        id: driver.id,
        fullName: driver.fullName || driver.username,
        route: 'Unassigned',
        rating: 4.5
      })).slice(0, 5);
    }
  });

  if (isAuthLoading || isStatsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 lg:p-6">
      <Header 
        title="Dashboard" 
        subtitle="Overview of system statistics and activities"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Routes</p>
              <h3 className="text-2xl font-bold">{stats?.activeRoutesCount || 0}</h3>
            </div>
            <RouteIcon className="h-8 w-8 text-primary opacity-75" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Vehicles</p>
              <h3 className="text-2xl font-bold">{stats?.activeVehiclesCount || 0}</h3>
            </div>
            <Car className="h-8 w-8 text-primary opacity-75" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Drivers</p>
              <h3 className="text-2xl font-bold">{stats?.driversCount || 0}</h3>
            </div>
            <User className="h-8 w-8 text-primary opacity-75" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Registered Users</p>
              <h3 className="text-2xl font-bold">{stats?.usersCount || 0}</h3>
            </div>
            <UserPlus className="h-8 w-8 text-primary opacity-75" />
          </div>
        </Card>
      </div>

      {/* Routes and Drivers Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Routes */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Routes</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {routes?.map((route) => (
                  <tr key={route.id} className="border-b">
                    <td className="p-4">{route.name}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        route.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                      }`}>
                        {route.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" className="text-primary mr-2">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-neutral-300">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Drivers */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Drivers</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Rating</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers?.map((driver) => (
                  <tr key={driver.id} className="border-b">
                    <td className="p-4">{driver.fullName}</td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <span className="text-warning mr-1">{driver.rating.toFixed(1)}</span>
                        <Star className="text-warning h-4 w-4" />
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" className="text-primary mr-2">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-neutral-300">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}