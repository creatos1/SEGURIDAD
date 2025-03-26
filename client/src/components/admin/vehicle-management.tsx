import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Vehicle, InsertVehicle } from "@shared/schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import { Plus, Pencil, Trash2, Search, AlertCircle, Calendar } from "lucide-react";
import { format } from "date-fns";

// Form schema for creating/editing vehicles
const vehicleFormSchema = z.object({
  vehicleNumber: z.string().min(2, { message: "Vehicle number is required" }),
  vehicleType: z.string().min(2, { message: "Vehicle type is required" }),
  capacity: z.coerce.number().min(1, { message: "Capacity must be at least 1" }),
  fuelStatus: z.coerce.number().min(0, { message: "Fuel status must be between 0 and 100" }).max(100),
  status: z.enum(["active", "maintenance", "inactive"]),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export default function VehicleManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all vehicles
  const { data: vehicles, isLoading, error } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
  });

  // Form for creating/editing vehicles
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      vehicleNumber: "",
      vehicleType: "Standard Transit Bus",
      capacity: 48,
      fuelStatus: 100,
      status: "active",
    },
  });

  // Create vehicle mutation
  const createVehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormValues) => {
      const res = await apiRequest(
        "POST", 
        "/api/vehicles", 
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Vehicle created",
        description: "The vehicle has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create vehicle",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update vehicle mutation
  const updateVehicleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: VehicleFormValues }) => {
      const res = await apiRequest(
        "PUT", 
        `/api/vehicles/${id}`, 
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      setIsDialogOpen(false);
      setEditingVehicleId(null);
      form.reset();
      toast({
        title: "Vehicle updated",
        description: "The vehicle has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update vehicle",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete vehicle mutation
  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      toast({
        title: "Vehicle deleted",
        description: "The vehicle has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete vehicle",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: VehicleFormValues) => {
    if (editingVehicleId !== null) {
      updateVehicleMutation.mutate({ id: editingVehicleId, data });
    } else {
      createVehicleMutation.mutate(data);
    }
  };

  // Handle edit vehicle
  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicleId(vehicle.id);
    
    // Set form values
    form.reset({
      vehicleNumber: vehicle.vehicleNumber,
      vehicleType: vehicle.vehicleType,
      capacity: vehicle.capacity,
      fuelStatus: vehicle.fuelStatus,
      status: vehicle.status as "active" | "maintenance" | "inactive",
    });
    
    setIsDialogOpen(true);
  };

  // Handle create new vehicle
  const handleCreateVehicle = () => {
    setEditingVehicleId(null);
    form.reset({
      vehicleNumber: "",
      vehicleType: "Standard Transit Bus",
      capacity: 48,
      fuelStatus: 100,
      status: "active",
    });
    setIsDialogOpen(true);
  };

  // Handle delete vehicle confirmation
  const handleDeleteVehicle = (id: number) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      deleteVehicleMutation.mutate(id);
    }
  };

  // Filter vehicles based on search query
  const filteredVehicles = vehicles?.filter(vehicle => 
    vehicle.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.vehicleType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper function for status badge color
  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-amber-100 text-amber-800';
      case 'inactive':
        return 'bg-neutral-100 text-neutral-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <Header 
        title="Vehicle Management" 
        subtitle="Create, edit and manage transit vehicles"
        actions={
          <div className="flex space-x-2">
            <div className="relative">
              <Input
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 w-[200px]"
              />
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateVehicle}>
                  <Plus className="mr-2 h-4 w-4" /> Add Vehicle
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingVehicleId ? "Edit Vehicle" : "Create New Vehicle"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="vehicleNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vehicle Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Bus #101" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="vehicleType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vehicle Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select vehicle type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Standard Transit Bus">Standard Transit Bus</SelectItem>
                                <SelectItem value="Articulated Bus">Articulated Bus</SelectItem>
                                <SelectItem value="Mini Bus">Mini Bus</SelectItem>
                                <SelectItem value="Double Decker">Double Decker</SelectItem>
                                <SelectItem value="Shuttle">Shuttle</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Passenger Capacity</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="fuelStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fuel Status (%)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" max="100" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createVehicleMutation.isPending || updateVehicleMutation.isPending}
                      >
                        {editingVehicleId ? (
                          updateVehicleMutation.isPending ? "Updating..." : "Update Vehicle"
                        ) : (
                          createVehicleMutation.isPending ? "Creating..." : "Create Vehicle"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
      
      <Card className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle Number</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Fuel Status</TableHead>
              <TableHead>Maintenance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-9 w-[100px] float-right" /></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-red-500">
                  Error loading vehicles
                </TableCell>
              </TableRow>
            ) : filteredVehicles?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  No vehicles found
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles?.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">
                    {vehicle.vehicleNumber}
                  </TableCell>
                  <TableCell>{vehicle.vehicleType}</TableCell>
                  <TableCell>{vehicle.capacity} passengers</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="h-2 w-24 bg-neutral-200 rounded-full overflow-hidden mr-2">
                        <div 
                          className={`h-full ${
                            vehicle.fuelStatus > 70 ? 'bg-green-500' : 
                            vehicle.fuelStatus > 30 ? 'bg-amber-500' : 
                            'bg-red-500'
                          }`} 
                          style={{ width: `${vehicle.fuelStatus}%` }}
                        />
                      </div>
                      <span className="text-sm text-neutral-600">{vehicle.fuelStatus}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {vehicle.lastMaintenance && (
                      <div className="flex items-center text-sm text-neutral-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        Last: {format(new Date(vehicle.lastMaintenance), 'MMM d, yyyy')}
                      </div>
                    )}
                    {vehicle.nextMaintenance && (
                      <div className={`flex items-center text-sm ${
                        new Date(vehicle.nextMaintenance) < new Date() 
                          ? 'text-red-600' 
                          : 'text-neutral-600'
                      }`}>
                        <AlertCircle className={`h-3 w-3 mr-1 ${
                          new Date(vehicle.nextMaintenance) < new Date()
                            ? 'text-red-600'
                            : 'text-neutral-600'
                        }`} />
                        Next: {format(new Date(vehicle.nextMaintenance), 'MMM d, yyyy')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span 
                      className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(vehicle.status)}`}
                    >
                      {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditVehicle(vehicle)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        disabled={deleteVehicleMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
