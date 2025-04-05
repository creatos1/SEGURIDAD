import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { Route, Assignment, LocationUpdate } from "@shared/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/layout/header";
import DriverRating from "./driver-rating";
import LeafletMap from "@/lib/leaflet-map";
import { Search, Navigation, Info, Clock, Users, Star } from "lucide-react";

type LiveRoute = Route & {
  activeVehicles: number;
  status: "on-time" | "delayed" | "issue";
  frequency: number;
  occupancy: "low" | "medium" | "high";
};

type RouteWithLocation = LiveRoute & {
  locations: {
    lat: number;
    lng: number;
    vehicleId: number;
    vehicleNumber: string;
    assignmentId: number;
  }[];
};

type Props = {
  favoritesOnly?: boolean;
  showHistory?: boolean;
};

export default function LiveRoutes({ favoritesOnly = false, showHistory = false }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<RouteWithLocation | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [driverToRate, setDriverToRate] = useState<{ id: number; name: string } | null>(null);
  const { subscribe, lastMessage } = useWebSocket();
  
  // Fetch all active routes
  const { data: routes, isLoading } = useQuery<Route[]>({
    queryKey: ['/api/routes/active'],
  });

  // Fetch route assignments
  const { data: assignments } = useQuery<Assignment[]>({
    queryKey: ['/api/assignments'],
  });
  
  // Subscribe to all active routes for real-time updates
  useEffect(() => {
    if (routes) {
      routes.forEach(route => {
        subscribe(`route:${route.id}`);
      });
    }
    
    // Clean up function
    return () => {
      // No need to unsubscribe, the socket will handle it
    };
  }, [routes, subscribe]);
  
  // Mock data for locations of vehicles
  // In a real implementation, this would come from the websocket
  const [locationUpdates, setLocationUpdates] = useState<{
    [assignmentId: number]: LocationUpdate;
  }>({});
  
  // Handle new location updates from websocket
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'location_update') {
      const update = lastMessage.data;
      setLocationUpdates(prev => ({
        ...prev,
        [update.assignmentId]: update
      }));
    }
  }, [lastMessage]);
  
  // Transform routes data to include status and other information
  const enhancedRoutes: RouteWithLocation[] = routes?.map(route => {
    // Get assignments for this route
    const routeAssignments = assignments?.filter(
      assignment => assignment.routeId === route.id && assignment.status === 'in-progress'
    ) || [];
    
    // Get vehicle locations for this route
    const locations = routeAssignments.map(assignment => {
      const update = locationUpdates[assignment.id];
      
      return {
        lat: update?.latitude || 25.76 + (Math.random() * 0.04 - 0.02), // Mock data
        lng: update?.longitude || -80.19 + (Math.random() * 0.04 - 0.02), // Mock data
        vehicleId: assignment.vehicleId,
        vehicleNumber: `Bus #${101 + assignment.vehicleId}`, // Mock data
        assignmentId: assignment.id
      };
    });
    
    return {
      ...route,
      activeVehicles: routeAssignments.length,
      status: ["on-time", "delayed", "issue"][Math.floor(Math.random() * 3)] as "on-time" | "delayed" | "issue", // Mock data
      frequency: route.frequency || 15,
      occupancy: ["low", "medium", "high"][Math.floor(Math.random() * 3)] as "low" | "medium" | "high", // Mock data
      locations
    };
  }) || [];
  
  // Filter routes based on search query
  const filteredRoutes = enhancedRoutes.filter(route => 
    route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (route.description && route.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Apply favorites filter if needed
  // This is a mock implementation - would normally be from user preferences
  const displayedRoutes = favoritesOnly 
    ? filteredRoutes.filter((_, index) => index % 2 === 0) // Mock: every other route is a favorite
    : showHistory
      ? filteredRoutes.filter((_, index) => index % 3 === 0) // Mock: every third route is in history
      : filteredRoutes;
  
  // Function to set up the route tracking view
  const handleTrackRoute = (route: RouteWithLocation) => {
    setSelectedRoute(route);
  };
  
  // Open rating modal
  const openRatingModal = (driverId: number, name: string) => {
    setDriverToRate({ id: driverId, name });
    setIsRatingModalOpen(true);
  };
  
  // Status badge color helper
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'on-time':
        return 'bg-green-100 text-green-800';
      case 'delayed':
        return 'bg-amber-100 text-amber-800';
      case 'issue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };
  
  // Page title based on mode
  const pageTitle = favoritesOnly 
    ? "Favorite Routes" 
    : showHistory
      ? "Route History"
      : "Live Routes";
  
  return (
    <div className="p-4 lg:p-6">
      <Header 
        title={pageTitle}
        subtitle={favoritesOnly 
          ? "Your saved route preferences" 
          : showHistory
            ? "Previously used routes"
            : "Real-time transit route tracking"
        }
        actions={
          <div className="relative">
            <Input
              placeholder="Search routes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-4 w-[200px]"
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        }
      />
      
      {/* Live Map */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Live Route Map</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">Refresh</Button>
              <Button variant="outline" size="sm">Filters</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <LeafletMap 
              id="user-map"
              center={[25.761681, -80.191788]} // Miami coordinates
              zoom={12}
              markers={
                selectedRoute 
                  ? selectedRoute.locations.map(loc => ({
                      position: [loc.lat, loc.lng],
                      type: 'driver',
                      popup: loc.vehicleNumber
                    }))
                  : enhancedRoutes.flatMap(route => 
                      route.locations.map(loc => ({
                        position: [loc.lat, loc.lng],
                        type: 'driver',
                        popup: `${route.name} - ${loc.vehicleNumber}`
                      }))
                    )
              }
              routes={
                selectedRoute 
                  ? [{
                      path: [
                        // Generate a mock route path
                        ...selectedRoute.locations.map(loc => [loc.lat, loc.lng] as [number, number]),
                        // Add some additional waypoints to make it look more like a route
                        [25.761681 + 0.01, -80.191788 - 0.01] as [number, number],
                        [25.761681 + 0.02, -80.191788 - 0.02] as [number, number]
                      ],
                      color: '#3f51b5',
                      weight: 4
                    }]
                  : enhancedRoutes.map((route, index) => ({
                      path: [
                        // Generate a mock route path based on locations
                        ...route.locations.map(loc => [loc.lat, loc.lng] as [number, number]),
                        // Add some additional points
                        [25.761681 + (index * 0.01), -80.191788 - (index * 0.01)] as [number, number]
                      ],
                      color: ['#3f51b5', '#2196f3', '#4caf50', '#ff9800'][index % 4],
                      weight: 3
                    }))
              }
              className="h-[400px] rounded-lg"
            />
            
            {/* Legend */}
            <div className="absolute top-4 left-4 bg-white shadow rounded-lg p-3">
              <h4 className="font-medium text-sm text-neutral-400 mb-2">Routes</h4>
              <div className="space-y-2">
                {enhancedRoutes.slice(0, 4).map((route, index) => (
                  <div key={route.id} className="flex items-center">
                    <span 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: ['#3f51b5', '#2196f3', '#4caf50', '#ff9800'][index % 4] }}
                    ></span>
                    <span className="text-sm text-neutral-400 ml-2">{route.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Available Routes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Available Routes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="border-b pb-4 last:border-0 last:pb-0">
                  <Skeleton className="h-6 w-[200px] mb-2" />
                  <div className="flex items-center mb-2">
                    <Skeleton className="h-4 w-[100px] mr-4" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                  <div className="flex items-center">
                    <Skeleton className="h-4 w-[120px] mr-4" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedRoutes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No routes found. Try adjusting your search.
            </div>
          ) : (
            displayedRoutes.map((route) => (
              <div key={route.id} className="border-b last:border-0 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="font-medium text-neutral-400">{route.name}</h4>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs px-2 py-0.5 ${getStatusBadge(route.status)} rounded-full`}>
                        {route.status === 'on-time' ? 'On Time' : 
                         route.status === 'delayed' ? 'Delayed' : 'Issue Reported'}
                      </span>
                      <span className="mx-2 text-neutral-300">•</span>
                      <span className="text-sm text-neutral-300">{route.activeVehicles} vehicles active</span>
                    </div>
                    <div className="flex items-center mt-2">
                      <div className="flex items-center mr-4">
                        <Clock className="text-neutral-300 w-4 h-4 mr-1" />
                        <span className="text-sm text-neutral-300">Every {route.frequency} mins</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="text-neutral-300 w-4 h-4 mr-1" />
                        <span className="text-sm text-neutral-300">
                          {route.occupancy.charAt(0).toUpperCase() + route.occupancy.slice(1)} occupancy
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex mt-3 md:mt-0">
                    <Button 
                      variant="default" 
                      className="bg-[#4caf50] hover:bg-[#43a047] text-white mr-2"
                      size="sm"
                      onClick={() => handleTrackRoute(route)}
                    >
                      <Navigation className="mr-1 h-4 w-4" />
                      Track
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => openRatingModal(route.id, route.name)}
                    >
                      <Star className="mr-1 h-4 w-4" />
                      Rate
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      
      {/* Rating Modal */}
      {isRatingModalOpen && driverToRate && (
        <DriverRating 
          driverId={driverToRate.id} 
          driverName={driverToRate.name} 
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
        />
      )}
    </div>
  );
}
