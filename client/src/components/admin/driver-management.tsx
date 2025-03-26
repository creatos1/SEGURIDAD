import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserRole } from "@shared/schema";
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
import { Plus, Pencil, Trash2, Search, Star, Route as RouteIcon } from "lucide-react";

// Types for the driver data
type Driver = {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  role: string;
};

type DriverWithDetails = Driver & {
  averageRating?: number;
  assignedRoute?: {
    id: number;
    name: string;
  };
};

// Form schema for creating/editing drivers
const driverFormSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).optional(),
  fullName: z.string().optional(),
});

type DriverFormValues = z.infer<typeof driverFormSchema>;

export default function DriverManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all drivers
  const { data: drivers, isLoading, error } = useQuery<Driver[]>({
    queryKey: ['/api/users', { role: UserRole.DRIVER }],
  });

  // Form for creating/editing drivers
  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
    },
  });

  // Create driver mutation
  const createDriverMutation = useMutation({
    mutationFn: async (data: DriverFormValues) => {
      const res = await apiRequest(
        "POST", 
        "/api/register", 
        {
          ...data,
          role: UserRole.DRIVER,
        }
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', { role: UserRole.DRIVER }] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Driver created",
        description: "The driver account has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create driver",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update driver mutation
  const updateDriverMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: DriverFormValues }) => {
      // Only include password if it's provided
      const updateData = {...data};
      if (!updateData.password) {
        delete updateData.password;
      }
      
      const res = await apiRequest(
        "PUT", 
        `/api/users/${id}`, 
        updateData
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', { role: UserRole.DRIVER }] });
      setIsDialogOpen(false);
      setEditingDriverId(null);
      form.reset();
      toast({
        title: "Driver updated",
        description: "The driver has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update driver",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete driver mutation
  const deleteDriverMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', { role: UserRole.DRIVER }] });
      toast({
        title: "Driver deleted",
        description: "The driver has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete driver",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: DriverFormValues) => {
    if (editingDriverId !== null) {
      updateDriverMutation.mutate({ id: editingDriverId, data });
    } else {
      createDriverMutation.mutate(data);
    }
  };

  // Handle edit driver
  const handleEditDriver = (driver: Driver) => {
    setEditingDriverId(driver.id);
    
    // Set form values
    form.reset({
      username: driver.username,
      email: driver.email,
      password: "", // Don't populate password
      fullName: driver.fullName || "",
    });
    
    setIsDialogOpen(true);
  };

  // Handle create new driver
  const handleCreateDriver = () => {
    setEditingDriverId(null);
    form.reset({
      username: "",
      email: "",
      password: "",
      fullName: "",
    });
    setIsDialogOpen(true);
  };

  // Handle delete driver confirmation
  const handleDeleteDriver = (id: number) => {
    if (window.confirm("Are you sure you want to delete this driver?")) {
      deleteDriverMutation.mutate(id);
    }
  };

  // Filter drivers based on search query
  const filteredDrivers = drivers?.filter(driver => 
    driver.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (driver.fullName && driver.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Mock data for ratings and assigned routes
  // In a real implementation, this would come from API calls
  const driversWithDetails: DriverWithDetails[] = filteredDrivers?.map(driver => ({
    ...driver,
    averageRating: Math.floor(Math.random() * 5 * 10) / 10 + 3, // Random rating between 3 and 5
    assignedRoute: Math.random() > 0.3 ? {
      id: Math.floor(Math.random() * 100),
      name: ["Downtown Express", "Airport Shuttle", "North Campus", "South Beach"][Math.floor(Math.random() * 4)]
    } : undefined
  })) || [];

  return (
    <div className="p-4 lg:p-6">
      <Header 
        title="Driver Management" 
        subtitle="Create, edit and manage driver accounts"
        actions={
          <div className="flex space-x-2">
            <div className="relative">
              <Input
                placeholder="Search drivers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 w-[200px]"
              />
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateDriver}>
                  <Plus className="mr-2 h-4 w-4" /> Add Driver
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingDriverId ? "Edit Driver" : "Create New Driver"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="johndoe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="john@example.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {editingDriverId ? "Password (leave blank to keep current)" : "Password"}
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="••••••••" type="password" {...field} value={field.value || ""} />
                          </FormControl>
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
                        disabled={createDriverMutation.isPending || updateDriverMutation.isPending}
                      >
                        {editingDriverId ? (
                          updateDriverMutation.isPending ? "Updating..." : "Update Driver"
                        ) : (
                          createDriverMutation.isPending ? "Creating..." : "Create Driver"
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
              <TableHead>Driver Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Assigned Route</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-5 w-[180px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-9 w-[100px] float-right" /></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-red-500">
                  Error loading drivers
                </TableCell>
              </TableRow>
            ) : driversWithDetails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  No drivers found
                </TableCell>
              </TableRow>
            ) : (
              driversWithDetails.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">
                    {driver.fullName || driver.username}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{driver.email}</span>
                      <span className="text-xs text-muted-foreground">@{driver.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {driver.assignedRoute ? (
                      <div className="flex items-center">
                        <RouteIcon className="h-4 w-4 text-primary mr-1" />
                        <span>{driver.assignedRoute.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {driver.averageRating ? (
                      <div className="flex items-center">
                        <span className="text-warning mr-1">{driver.averageRating.toFixed(1)}</span>
                        <Star className="h-4 w-4 text-warning" />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No ratings</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditDriver(driver)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteDriver(driver.id)}
                        disabled={deleteDriverMutation.isPending}
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
