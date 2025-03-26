import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { Assignment, RouteStop, DriverRating } from "@shared/schema";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/layout/header";
import LeafletMap from "@/lib/leaflet-map";
import VehicleInfo from "./vehicle-info";
import {
  Flag,
  Check,
  Play,
  Navigation,
  AlertTriangle,
  Clock,
  TrendingUp,
  Star,
  Calendar,
  Users,
  Bus,
} from "lucide-react";

type Props = {
  showSchedule?: boolean;
  showRatings?: boolean;
};

// Stop status types
type StopStatus = "completed" | "current" | "upcoming";

// Enhanced stop with status
type EnhancedStop = RouteStop & {
  status: StopStatus;
  scheduledTime: string;
  actualTime?: string;
  eta?: string;
};

export default function MyRoute({ showSchedule = false, showRatings = false }: Props) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(showSchedule ? "schedule" : showRatings ? "ratings" : "route");
  const [isRouteStarted, setIsRouteStarted] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const { sendLocationUpdate } = useWebSocket();
  
  // Fetch driver's active assignment
  const { data: assignment, isLoading: isAssignmentLoading } = useQuery<Assignment>({
    queryKey: ['/api/assignments', { driverId: user?.id }],
    select: (data: Assignment[]) => data.find(a => a.status === "in-progress"),
  });
  
  // Fetch route details if we have an assignment
  const { data: route, isLoading: isRouteLoading } = useQuery({
    queryKey: ['/api/routes', assignment?.routeId],
    enabled: !!assignment?.routeId,
  });
  
  // Fetch route stops
  const { data: stops, isLoading: isStopsLoading } = useQuery<RouteStop[]>({
    queryKey: ['/api/routes', assignment?.routeId, 'stops'],
    enabled: !!assignment?.routeId,
  });
  
  // Fetch ratings
  const { data: ratings, isLoading: isRatingsLoading } = useQuery<DriverRating[]>({
    queryKey: ['/api/driver-ratings', { driverId: user?.id }],
    enabled: !!user?.id && showRatings,
  });
  
  // Start tracking position for the route
  const startRoute = () => {
    setIsRouteStarted(true);
    
    // Start location tracking
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentPosition({ lat: latitude, lng: longitude });
          
          // Send location update to server via WebSocket
          if (assignment) {
            sendLocationUpdate(
              assignment.id,
              latitude,
              longitude,
              'on-time',
              position.coords.speed || undefined,
              position.coords.heading || undefined
            );
          }
        },
        (error) => console.error('Error getting location:', error),
        { enableHighAccuracy: true }
      );
    }
  };
  
  // Clean up location tracking on component unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);
  
  // Mock data for the route to display
  // In a real app, this would come from API responses
  const mockCurrentPosition = { lat: 25.761681, lng: -80.191788 }; // Miami coordinates
  const currentPos = currentPosition || mockCurrentPosition;
  
  // Prepare stops with status
  const enhancedStops: EnhancedStop[] = stops?.map((stop, index) => {
    const now = new Date();
    const baseTime = new Date(now);
    baseTime.setHours(9, 0, 0, 0); // Set base time to 9:00 AM
    
    // Increment time by 15 minutes for each stop
    const stopTime = new Date(baseTime);
    stopTime.setMinutes(baseTime.getMinutes() + (index * 15));
    
    // Set status based on the current time
    let status: StopStatus = "upcoming";
    let actualTime: string | undefined = undefined;
    let eta: string | undefined = undefined;
    
    if (isRouteStarted) {
      if (index < 2) {
        status = "completed";
        actualTime = format(new Date(stopTime.getTime() + (Math.random() > 0.5 ? 2 : 0) * 60000), 'h:mm a');
      } else if (index === 2) {
        status = "current";
        eta = format(new Date(now.getTime() + 3 * 60000), 'h:mm a');
      } else {
        status = "upcoming";
      }
    }
    
    return {
      ...stop,
      status,
      scheduledTime: format(stopTime, 'h:mm a'),
      actualTime,
      eta
    };
  }) || [];
  
  return (
    <div className="p-4 lg:p-6">
      <Header 
        title="My Route"
        subtitle={route ? `${route.name} - ${assignment ? `Bus #${assignment.vehicleId + 100}` : ''}` : 'No active route'}
        actions={
          !isRouteStarted && (
            <Button 
              className="px-4 py-2 bg-[#4caf50] text-white rounded-lg shadow flex items-center"
              onClick={startRoute}
            >
              <Play className="mr-2 h-4 w-4" />
              Start Route
            </Button>
          )
        }
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="route">Route Navigation</TabsTrigger>
          <TabsTrigger value="schedule">Stop Schedule</TabsTrigger>
          <TabsTrigger value="vehicle">Vehicle Info</TabsTrigger>
          <TabsTrigger value="ratings">My Ratings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="route" className="space-y-4">
          {/* Route Map */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Route Navigation</CardTitle>
                <Button 
                  variant="outline" 
                  className="text-[#ff9800] border-[#ff9800] hover:bg-[#ff9800]/10"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Report Issue
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <LeafletMap 
                  id="driver-map"
                  center={[currentPos.lat, currentPos.lng]}
                  zoom={14}
                  markers={[
                    // Current position marker
                    { position: [currentPos.lat, currentPos.lng], type: 'current', popup: 'Your Position' },
                    // Stop markers
                    ...(enhancedStops.map((stop, i) => ({
                      position: [
                        currentPos.lat + (i * 0.005 - 0.01),
                        currentPos.lng + (i * 0.005 - 0.01)
                      ] as [number, number],
                      type: 'stop' as const,
                      popup: stop.name
                    })))
                  ]}
                  routes={[
                    // Route path
                    {
                      path: [
                        [currentPos.lat, currentPos.lng],
                        [currentPos.lat + 0.005, currentPos.lng + 0.005],
                        [currentPos.lat + 0.01, currentPos.lng + 0.01],
                        [currentPos.lat + 0.015, currentPos.lng + 0.005]
                      ],
                      color: '#ff9800',
                      weight: 4
                    }
                  ]}
                  className="h-[400px] rounded-lg"
                />
                
                {/* Route indicators */}
                <div className="absolute top-4 left-4 bg-white shadow rounded-lg p-3">
                  <h4 className="font-medium text-sm text-neutral-400 mb-2">Route Information</h4>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <Clock className="text-[#ff9800] w-4 h-4 mr-1" />
                      <span className="text-sm text-neutral-400">
                        Next stop: {isRouteStarted ? '3 min' : 'Not started'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Flag className="text-[#ff9800] w-4 h-4 mr-1" />
                      <span className="text-sm text-neutral-400">
                        {enhancedStops[2]?.name || 'Next Stop'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="text-[#4caf50] w-4 h-4 mr-1" />
                      <span className="text-sm text-neutral-400">
                        {isRouteStarted ? 'On schedule' : 'Ready to start'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Direction indicator */}
                <div className="absolute bottom-4 right-4 bg-white shadow rounded-lg p-2">
                  <div className="flex items-center">
                    <Navigation className="text-[#ff9800] w-4 h-4 mr-1" />
                    <span className="text-sm text-neutral-400">Continue 0.5 miles</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Passenger Information */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Passenger Information</CardTitle>
                <div>
                  <span className="text-sm text-neutral-300">
                    Current Load: <span className="font-medium text-neutral-400">24/48</span>
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-[#2196f3] bg-opacity-10 flex items-center justify-center mr-4">
                    <TrendingUp className="text-[#2196f3] w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-neutral-300 text-sm">Boarded Today</p>
                    <p className="text-xl font-bold text-neutral-400">127</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-[#4caf50] bg-opacity-10 flex items-center justify-center mr-4">
                    <Clock className="text-[#4caf50] w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-neutral-300 text-sm">On-Time Performance</p>
                    <p className="text-xl font-bold text-neutral-400">96%</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-[#ff9800] bg-opacity-10 flex items-center justify-center mr-4">
                    <Users className="text-[#ff9800] w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-neutral-300 text-sm">Average Occupancy</p>
                    <p className="text-xl font-bold text-neutral-400">58%</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-[#3f51b5] bg-opacity-10 flex items-center justify-center mr-4">
                    <Star className="text-[#3f51b5] w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-neutral-300 text-sm">Driver Rating</p>
                    <p className="text-xl font-bold text-neutral-400">4.8/5.0</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="schedule">
          {/* Stop Schedule */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Stop Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {isStopsLoading ? (
                <div className="space-y-6">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex">
                      <div className="mr-4 flex flex-col items-center">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-16 w-0.5 my-1" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[120px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-4">
                  {enhancedStops.map((stop, index) => (
                    <li key={stop.id} className="flex">
                      <div className="mr-4 flex flex-col items-center">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                          stop.status === 'completed' 
                            ? 'bg-[#4caf50]' 
                            : stop.status === 'current'
                              ? 'bg-[#ff9800]'
                              : 'bg-neutral-200'
                        }`}>
                          {stop.status === 'completed' ? (
                            <Check className="text-white w-3 h-3" />
                          ) : stop.status === 'current' ? (
                            <Navigation className="text-white w-3 h-3" />
                          ) : (
                            <Flag className="text-white w-3 h-3" />
                          )}
                        </div>
                        {index < enhancedStops.length - 1 && (
                          <div className="h-full w-0.5 bg-neutral-200 my-1"></div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h4 className="font-medium text-neutral-400">{stop.name}</h4>
                          {stop.status === 'completed' && (
                            <span className="ml-2 text-xs text-[#4caf50]">Completed</span>
                          )}
                          {stop.status === 'current' && (
                            <span className="ml-2 text-xs text-[#ff9800]">Current</span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-300">Scheduled: {stop.scheduledTime}</p>
                        {stop.actualTime && (
                          <p className="text-sm text-neutral-300">Actual: {stop.actualTime}</p>
                        )}
                        {stop.eta && (
                          <p className="text-sm text-[#ff9800] font-medium">ETA: {stop.eta}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="vehicle">
          <VehicleInfo />
        </TabsContent>
        
        <TabsContent value="ratings">
          {/* Driver Ratings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>My Ratings & Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Average Rating */}
                <div className="md:w-1/3">
                  <div className="bg-white p-6 rounded-lg shadow text-center">
                    <Star className="h-10 w-10 text-[#ff9800] mx-auto mb-2" />
                    <h3 className="text-3xl font-bold text-[#ff9800]">4.8</h3>
                    <p className="text-neutral-400">Average Rating</p>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>5 stars</span>
                        <span>75%</span>
                      </div>
                      <Progress value={75} className="h-2 mb-2" />
                      
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>4 stars</span>
                        <span>20%</span>
                      </div>
                      <Progress value={20} className="h-2 mb-2" />
                      
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>3 stars</span>
                        <span>5%</span>
                      </div>
                      <Progress value={5} className="h-2 mb-2" />
                      
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>2 stars</span>
                        <span>0%</span>
                      </div>
                      <Progress value={0} className="h-2 mb-2" />
                      
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>1 star</span>
                        <span>0%</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                  </div>
                </div>
                
                {/* Recent Reviews */}
                <div className="md:w-2/3">
                  <h3 className="font-semibold text-lg mb-4">Recent Reviews</h3>
                  {isRatingsLoading ? (
                    <div className="space-y-4">
                      {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="border-b pb-4">
                          <div className="flex items-center mb-2">
                            <Skeleton className="h-4 w-20 mr-2" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <Skeleton className="h-16 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : ratings && ratings.length > 0 ? (
                    <div className="space-y-4">
                      {ratings.map((rating) => (
                        <div key={rating.id} className="border-b pb-4 last:border-0">
                          <div className="flex items-center mb-2">
                            <div className="flex">
                              {Array(5).fill(0).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${
                                    i < rating.rating ? 'text-[#ff9800] fill-[#ff9800]' : 'text-neutral-200'
                                  }`} 
                                />
                              ))}
                            </div>
                            <span className="text-sm text-neutral-400 ml-2">
                              {format(new Date(rating.createdAt), 'MMMM d, yyyy')}
                            </span>
                          </div>
                          <p className="text-neutral-600">
                            {rating.comment || "No comment provided."}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-400">
                      <Star className="h-12 w-12 mx-auto text-neutral-300 mb-2" />
                      <p>No ratings received yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
