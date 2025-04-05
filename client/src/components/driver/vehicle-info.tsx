import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Vehicle, Assignment } from "@shared/schema";
import { format, addDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Calendar, TrendingUp, AlertTriangle } from "lucide-react";

export default function VehicleInfo() {
  const { user } = useAuth();
  
  // Fetch driver's active assignment
  const { data: assignment, isLoading: isAssignmentLoading } = useQuery<Assignment>({
    queryKey: ['/api/assignments', { driverId: user?.id }],
    select: (data: Assignment[]) => data.find(a => a.status === "in-progress"),
  });
  
  // Fetch vehicle details if we have an assignment
  const { data: vehicle, isLoading: isVehicleLoading } = useQuery<Vehicle>({
    queryKey: ['/api/vehicles', assignment?.vehicleId],
    enabled: !!assignment?.vehicleId,
  });
  
  // Mock data for demo purpose - this would come from the API in a real implementation
  const mockVehicle = {
    id: assignment?.vehicleId || 1,
    vehicleNumber: `Bus #${(assignment?.vehicleId || 0) + 100}`,
    vehicleType: "Standard Transit Bus",
    capacity: 48,
    fuelStatus: 75,
    nextMaintenance: addDays(new Date(), 3),
  };
  
  // Use the actual vehicle data if available, otherwise fall back to mock data
  const vehicleData = vehicle || mockVehicle;
  
  const isLoading = isAssignmentLoading || isVehicleLoading;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Vehicle Information</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-20 mb-1" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-6 w-20 mt-3 mb-1" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-6 w-20 mt-3 mb-1" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-6 w-20 mt-3 mb-1" />
            <Skeleton className="h-2 w-full mt-2" />
            <Skeleton className="h-6 w-20 mt-3 mb-1" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full mt-4" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-neutral-300">Vehicle ID</p>
              <p className="font-medium text-neutral-400">{vehicleData.vehicleNumber}</p>
            </div>
            
            <div>
              <p className="text-sm text-neutral-300">Vehicle Type</p>
              <p className="font-medium text-neutral-400">{vehicleData.vehicleType}</p>
            </div>
            
            <div>
              <p className="text-sm text-neutral-300">Capacity</p>
              <p className="font-medium text-neutral-400">{vehicleData.capacity} passengers</p>
            </div>
            
            <div>
              <p className="text-sm text-neutral-300">Fuel Status</p>
              <div className="flex items-center mt-1">
                <div className="h-2 w-full bg-neutral-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      vehicleData.fuelStatus > 70 ? 'bg-green-500' : 
                      vehicleData.fuelStatus > 30 ? 'bg-amber-500' : 
                      'bg-red-500'
                    }`} 
                    style={{ width: `${vehicleData.fuelStatus}%` }}
                  />
                </div>
                <span className="ml-2 text-sm text-neutral-400">{vehicleData.fuelStatus}%</span>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-neutral-300">Next Maintenance</p>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-neutral-400" />
                <p className="font-medium text-neutral-400">
                  {format(vehicleData.nextMaintenance, 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h3 className="font-medium text-neutral-400">Vehicle Status</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">Mileage</p>
                    <p className="font-medium text-neutral-400">34,578 miles</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                    <Calendar className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">Age</p>
                    <p className="font-medium text-neutral-400">2.5 years</p>
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full mt-4 text-[#ff9800] border-[#ff9800] hover:bg-[#ff9800]/10"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Report Issue
            </Button>
            
            {/* Maintenance History */}
            <div className="mt-6">
              <h3 className="font-medium text-neutral-400 mb-3">Maintenance History</h3>
              <div className="space-y-3">
                <div className="bg-neutral-50 p-3 rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-neutral-600">Routine Service</h4>
                      <p className="text-sm text-neutral-400">Oil change, filters, brake inspection</p>
                    </div>
                    <span className="text-xs text-neutral-400">14 days ago</span>
                  </div>
                </div>
                
                <div className="bg-neutral-50 p-3 rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-neutral-600">Tire Replacement</h4>
                      <p className="text-sm text-neutral-400">All tires replaced</p>
                    </div>
                    <span className="text-xs text-neutral-400">45 days ago</span>
                  </div>
                </div>
                
                <div className="bg-neutral-50 p-3 rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-neutral-600">Major Inspection</h4>
                      <p className="text-sm text-neutral-400">Full vehicle inspection and service</p>
                    </div>
                    <span className="text-xs text-neutral-400">3 months ago</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Safety Equipment */}
            <div>
              <h3 className="font-medium text-neutral-400 mb-3">Safety Equipment</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center">
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-2">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <span className="text-sm">First Aid Kit</span>
                </div>
                
                <div className="flex items-center">
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-2">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <span className="text-sm">Fire Extinguisher</span>
                </div>
                
                <div className="flex items-center">
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-2">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <span className="text-sm">Emergency Exits</span>
                </div>
                
                <div className="flex items-center">
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-2">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <span className="text-sm">Safety Hammer</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
