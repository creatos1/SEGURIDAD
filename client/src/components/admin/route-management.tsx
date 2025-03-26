import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Route, InsertRoute } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Pencil, Trash2, Search } from "lucide-react";

// Form schema based on the shared schema but with some adjustments for the form
const routeFormSchema = z.object({
  name: z.string().min(3, { message: "Route name must be at least 3 characters" }),
  description: z.string().optional(),
  startLocation: z.string().min(1, { message: "Start location is required" }),
  endLocation: z.string().min(1, { message: "End location is required" }),
  waypoints: z.string().optional(),
  frequency: z.coerce.number().min(1, { message: "Frequency must be at least 1 minute" }),
  status: z.enum(["active", "inactive"]),
});

type RouteFormValues = z.infer<typeof routeFormSchema>;

export default function RouteManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all routes
  const { data: routes, isLoading, error } = useQuery<Route[]>({
    queryKey: ['/api/routes'],
  });

  // Form for creating/editing routes
  const form = useForm<RouteFormValues>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: {
      name: "",
      description: "",
      startLocation: "",
      endLocation: "",
      waypoints: "",
      frequency: 15,
      status: "active",
    },
  });

  // Create route mutation
  const createRouteMutation = useMutation({
    mutationFn: async (data: RouteFormValues) => {
      // Format waypoints as array if provided
      const formattedData: Partial<InsertRoute> = {
        ...data,
        waypoints: data.waypoints ? data.waypoints.split(',').map(wp => wp.trim()) : undefined
      };
      
      const res = await apiRequest(
        "POST", 
        "/api/routes", 
        formattedData
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Route created",
        description: "The route has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create route",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update route mutation
  const updateRouteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RouteFormValues }) => {
      // Format waypoints as array if provided
      const formattedData: Partial<InsertRoute> = {
        ...data,
        waypoints: data.waypoints ? data.waypoints.split(',').map(wp => wp.trim()) : undefined
      };
      
      const res = await apiRequest(
        "PUT", 
        `/api/routes/${id}`, 
        formattedData
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      setIsDialogOpen(false);
      setEditingRouteId(null);
      form.reset();
      toast({
        title: "Route updated",
        description: "The route has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update route",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete route mutation
  const deleteRouteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/routes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      toast({
        title: "Route deleted",
        description: "The route has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete route",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: RouteFormValues) => {
    if (editingRouteId !== null) {
      updateRouteMutation.mutate({ id: editingRouteId, data });
    } else {
      createRouteMutation.mutate(data);
    }
  };

  // Handle edit route
  const handleEditRoute = (route: Route) => {
    setEditingRouteId(route.id);
    
    // Set form values
    form.reset({
      name: route.name,
      description: route.description || "",
      startLocation: route.startLocation,
      endLocation: route.endLocation,
      waypoints: route.waypoints ? route.waypoints.join(', ') : "",
      frequency: route.frequency,
      status: route.status as "active" | "inactive",
    });
    
    setIsDialogOpen(true);
  };

  // Handle create new route
  const handleCreateRoute = () => {
    setEditingRouteId(null);
    form.reset({
      name: "",
      description: "",
      startLocation: "",
      endLocation: "",
      waypoints: "",
      frequency: 15,
      status: "active",
    });
    setIsDialogOpen(true);
  };

  // Handle delete route confirmation
  const handleDeleteRoute = (id: number) => {
    if (window.confirm("Are you sure you want to delete this route?")) {
      deleteRouteMutation.mutate(id);
    }
  };

  // Filter routes based on search query
  const filteredRoutes = routes?.filter(route => 
    route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (route.description && route.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 lg:p-6">
      <Header 
        title="Route Management" 
        subtitle="Create, edit and manage transportation routes"
        actions={
          <div className="flex space-x-2">
            <div className="relative">
              <Input
                placeholder="Search routes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 w-[200px]"
              />
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateRoute}>
                  <Plus className="mr-2 h-4 w-4" /> Add Route
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingRouteId ? "Edit Route" : "Create New Route"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Route Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Downtown Express" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Route description..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Central Station" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="endLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Airport Terminal" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="waypoints"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Waypoints (Comma separated)</FormLabel>
                          <FormControl>
                            <Input placeholder="City Hall, Main St, Downtown Mall" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frequency (minutes)</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
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
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
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
                        disabled={createRouteMutation.isPending || updateRouteMutation.isPending}
                      >
                        {editingRouteId ? (
                          updateRouteMutation.isPending ? "Updating..." : "Update Route"
                        ) : (
                          createRouteMutation.isPending ? "Creating..." : "Create Route"
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
              <TableHead>Route Name</TableHead>
              <TableHead>Start/End Location</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[250px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-9 w-[100px] float-right" /></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-red-500">
                  Error loading routes
                </TableCell>
              </TableRow>
            ) : filteredRoutes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  No routes found
                </TableCell>
              </TableRow>
            ) : (
              filteredRoutes?.map((route) => (
                <TableRow key={route.id}>
                  <TableCell className="font-medium">
                    {route.name}
                    {route.description && (
                      <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                        {route.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">From: {route.startLocation}</span>
                      <span className="text-sm">To: {route.endLocation}</span>
                    </div>
                  </TableCell>
                  <TableCell>Every {route.frequency} min</TableCell>
                  <TableCell>
                    <span 
                      className={`px-2 py-1 text-xs rounded-full ${
                        route.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-neutral-100 text-neutral-800'
                      }`}
                    >
                      {route.status.charAt(0).toUpperCase() + route.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditRoute(route)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteRoute(route.id)}
                        disabled={deleteRouteMutation.isPending}
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
