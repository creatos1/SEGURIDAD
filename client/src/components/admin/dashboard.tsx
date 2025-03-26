import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import LeafletMap from "@/lib/leaflet-map";
import {
  Route,
  Bus,
  Users,
  UserPlus,
  AlertTriangle,
  Edit,
  Plus,
  Search,
  Trash2,
  LayoutDashboard,
  AlertCircle,
  PersonStanding,
  Car,
  MapPin,
  Star
} from "lucide-react";

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
  type: 'route_added' | 'driver_assigned' | 'delay_reported' | 'maintenance_required' | 'route_modified';
  subject: string;
  timestamp: string;
  timeAgo: string;
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
        vehicleCount: 0 // This would come from the API
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
        route: 'Unassigned', // This would come from the API
        rating: 4.5 // This would come from the API
      })).slice(0, 5);
    }
  });
  
  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    // Subscribe to the admin dashboard channel
    subscribe('admin:dashboard');
    
    // Generate some mock activities for demonstration
    const mockActivities: ActivityItem[] = [
      {
        id: 1,
        type: 'route_added',
        subject: 'Downtown Express',
        timestamp: new Date().toISOString(),
        timeAgo: '10 minutes ago'
      },
      {
        id: 2,
        type: 'driver_assigned',
        subject: 'Carlos Mendez',
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
        timeAgo: '25 minutes ago'
      },
      {
        id: 3,
        type: 'delay_reported',
        subject: 'North Route',
        timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        timeAgo: '45 minutes ago'
      },
      {
        id: 4,
        type: 'maintenance_required',
        subject: 'Bus #103',
        timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
        timeAgo: '1 hour ago'
      },
      {
        id: 5,
        type: 'route_modified',
        subject: 'Airport Express',
        timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
        timeAgo: '2 hours ago'
      }
    ];
    
    setActivities(mockActivities);
  }, [subscribe]);
  
  // Handle new real-time updates
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'activity') {
      const newActivity = lastMessage.data;
      
      setActivities(prev => [
        {
          id: newActivity.id,
          type: newActivity.type,
          subject: newActivity.subject,
          timestamp: newActivity.timestamp,
          timeAgo: 'Just now'
        },
        ...prev.slice(0, 4) // Keep only the latest 5 activities
      ]);
      
      toast({
        title: 'New activity',
        description: `${getActivityDescription(newActivity.type, newActivity.subject)}`,
      });
    }
  }, [lastMessage, toast]);
  
  // Helper function to get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'route_added':
        return <Plus className="h-4 w-4 text-primary" />;
      case 'driver_assigned':
        return <UserPlus className="h-4 w-4 text-success" />;
      case 'delay_reported':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'maintenance_required':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'route_modified':
        return <Edit className="h-4 w-4 text-primary" />;
      default:
        return <Edit className="h-4 w-4 text-primary" />;
    }
  };
  
  // Helper function to get activity description
  const getActivityDescription = (type: string, subject: string) => {
    switch (type) {
      case 'route_added':
        return `New route added: ${subject}`;
      case 'driver_assigned':
        return `New driver assigned: ${subject}`;
      case 'delay_reported':
        return `Delay reported on ${subject}`;
      case 'maintenance_required':
        return `Vehicle maintenance required: ${subject}`;
      case 'route_modified':
        return `Route modified: ${subject}`;
      default:
        return `Activity: ${subject}`;
    }
  };
  
  // Helper function to get activity background color
  const getActivityBgColor = (type: string) => {
    switch (type) {
      case 'route_added':
        return 'bg-primary bg-opacity-10';
      case 'driver_assigned':
        return 'bg-success bg-opacity-10';
      case 'delay_reported':
        return 'bg-warning bg-opacity-10';
      case 'maintenance_required':
        return 'bg-destructive bg-opacity-10';
      case 'route_modified':
        return 'bg-primary bg-opacity-10';
      default:
        return 'bg-neutral-200';
    }
  };
  
  // Helper function to get activity text color
  const getActivityTextColor = (type: string) => {
    switch (type) {
      case 'route_added':
        return 'text-primary';
      case 'driver_assigned':
        return 'text-success';
      case 'delay_reported':
        return 'text-warning';
      case 'maintenance_required':
        return 'text-destructive';
      case 'route_modified':
        return 'text-primary';
      default:
        return 'text-neutral-400';
    }
  };
  
  return (
    <div className="p-4 lg:p-6">
      <Header title="Admin Dashboard" />
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mr-4">
                <Route className="text-primary" />
              </div>
              <div>
                <p className="text-neutral-300 text-sm">Active Routes</p>
                {isStatsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-neutral-400">{stats?.activeRoutesCount || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-info bg-opacity-10 flex items-center justify-center mr-4">
                <Bus className="text-info" />
              </div>
              <div>
                <p className="text-neutral-300 text-sm">Active Vehicles</p>
                {isStatsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-neutral-400">{stats?.activeVehiclesCount || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-success bg-opacity-10 flex items-center justify-center mr-4">
                <Car className="text-success" />
              </div>
              <div>
                <p className="text-neutral-300 text-sm">Active Drivers</p>
                {isStatsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-neutral-400">{stats?.driversCount || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-warning bg-opacity-10 flex items-center justify-center mr-4">
                <Users className="text-warning" />
              </div>
              <div>
                <p className="text-neutral-300 text-sm">Active Users</p>
                {isStatsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-neutral-400">{stats?.usersCount || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Active Routes Map */}
        <Card className="col-span-2">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium text-neutral-400">Active Routes Overview</h3>
          </div>
          <CardContent className="p-4">
            <div className="relative">
              <LeafletMap 
                id="admin-map"
                center={[25.761681, -80.191788]} // Miami coordinates
                zoom={12}
                markers={[
                  { position: [25.761681, -80.191788], type: 'driver', popup: 'Downtown Express - Bus #101' },
                  { position: [25.781681, -80.171788], type: 'driver', popup: 'Airport Shuttle - Bus #102' },
                  { position: [25.751681, -80.201788], type: 'driver', popup: 'North Campus - Bus #103' }
                ]}
                routes={[
                  { 
                    path: [
                      [25.761681, -80.191788],
                      [25.765681, -80.195788],
                      [25.771681, -80.195788],
                      [25.771681, -80.185788]
                    ], 
                    color: '#3f51b5',
                    weight: 4
                  },
                  { 
                    path: [
                      [25.781681, -80.171788],
                      [25.785681, -80.175788],
                      [25.785681, -80.165788]
                    ], 
                    color: '#2196f3',
                    weight: 4
                  },
                  { 
                    path: [
                      [25.751681, -80.201788],
                      [25.745681, -80.205788],
                      [25.745681, -80.215788]
                    ], 
                    color: '#ff9800',
                    weight: 4
                  }
                ]}
                className="h-[400px] rounded-lg"
              />
              <div className="absolute bottom-4 right-4 bg-white shadow rounded-lg p-2">
                <Button variant="ghost" size="icon">
                  <Search className="h-5 w-5 text-neutral-400" />
                </Button>
              </div>
              <div className="absolute top-4 left-4 bg-white shadow rounded-lg p-2">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="h-3 w-3 bg-success rounded-full"></span>
                    <span className="text-sm text-neutral-400">On time</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="h-3 w-3 bg-warning rounded-full"></span>
                    <span className="text-sm text-neutral-400">Delayed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="h-3 w-3 bg-destructive rounded-full"></span>
                    <span className="text-sm text-neutral-400">Issue reported</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Activity */}
        <Card>
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium text-neutral-400">Recent Activity</h3>
            <Button variant="link" size="sm" className="text-primary">View All</Button>
          </div>
          <CardContent className="p-4">
            <ul className="space-y-4">
              {isAuthLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <li key={i} className="flex">
                    <Skeleton className="h-10 w-10 rounded-full mr-3 flex-shrink-0" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </li>
                ))
              ) : (
                activities.map((activity) => (
                  <li key={activity.id} className="flex">
                    <div className={`h-10 w-10 rounded-full ${getActivityBgColor(activity.type)} flex items-center justify-center mr-3 flex-shrink-0`}>
                      <span className={`${getActivityTextColor(activity.type)} text-sm`}>
                        {getActivityIcon(activity.type)}
                      </span>
                    </div>
                    <div>
                      <p className="text-neutral-400">
                        {getActivityDescription(activity.type, activity.subject)}
                      </p>
                      <p className="text-xs text-neutral-300">{activity.timeAgo}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
      
      {/* Routes & Drivers Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Routes Table */}
        <Card>
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium text-neutral-400">Routes Overview</h3>
            <Button size="sm" className="bg-primary text-white">Add Route</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="text-left p-4 text-sm font-medium text-neutral-400">Route Name</th>
                  <th className="text-left p-4 text-sm font-medium text-neutral-400">Active Vehicles</th>
                  <th className="text-left p-4 text-sm font-medium text-neutral-400">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-neutral-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isRoutesLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="border-t border-neutral-100">
                      <td className="p-4"><Skeleton className="h-5 w-32" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-10" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-16" /></td>
                    </tr>
                  ))
                ) : (
                  routes?.map((route) => (
                    <tr key={route.id} className="border-t border-neutral-100">
                      <td className="p-4 text-neutral-400">{route.name}</td>
                      <td className="p-4 text-neutral-400">{route.vehicleCount}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 ${route.status === 'active' ? 'bg-success bg-opacity-10 text-success' : 'bg-neutral-200 text-neutral-400'} text-xs rounded-full`}>
                          {route.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="icon" className="text-primary mr-2">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-neutral-300">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
        
        {/* Drivers Table */}
        <Card>
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium text-neutral-400">Drivers Overview</h3>
            <Button size="sm" className="bg-primary text-white">Add Driver</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="text-left p-4 text-sm font-medium text-neutral-400">Driver Name</th>
                  <th className="text-left p-4 text-sm font-medium text-neutral-400">Assigned Route</th>
                  <th className="text-left p-4 text-sm font-medium text-neutral-400">Rating</th>
                  <th className="text-left p-4 text-sm font-medium text-neutral-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isDriversLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="border-t border-neutral-100">
                      <td className="p-4"><Skeleton className="h-5 w-32" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-32" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-16" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-16" /></td>
                    </tr>
                  ))
                ) : (
                  drivers?.map((driver) => (
                    <tr key={driver.id} className="border-t border-neutral-100">
                      <td className="p-4 text-neutral-400">{driver.fullName}</td>
                      <td className="p-4 text-neutral-400">{driver.route}</td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <span className="text-warning mr-1">{driver.rating.toFixed(1)}</span>
                          <Star className="text-warning h-4 w-4" />
                        </div>
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="icon" className="text-primary mr-2">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-neutral-300">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
