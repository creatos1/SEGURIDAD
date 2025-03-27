
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import LeafletMap from '@/lib/leaflet-map';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from 'lucide-react';
import type { Route } from '@shared/schema';

export default function RouteCreator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [description, setDescription] = useState('');
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Fetch existing routes
  const { data: routes, isLoading } = useQuery<Route[]>({
    queryKey: ['/api/routes'],
  });

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (!isDrawing) return;
    setCoordinates(prev => [...prev, [lat, lng]]);
  }, [isDrawing]);

  const handleSave = async () => {
    if (coordinates.length < 2) {
      toast({
        title: "Error",
        description: "Please draw at least a start and end point for the route",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: routeName,
          description,
          startLocation: `${coordinates[0][0]},${coordinates[0][1]}`,
          endLocation: `${coordinates[coordinates.length-1][0]},${coordinates[coordinates.length-1][1]}`,
          waypoints: coordinates.map(coord => `${coord[0]},${coord[1]}`),
          status: 'active',
          frequency: 15
        }),
      });

      if (!response.ok) throw new Error('Failed to create route');
      
      await queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      
      toast({
        title: "Success",
        description: "Route created successfully"
      });

      setIsDialogOpen(false);
      setRouteName('');
      setDescription('');
      setCoordinates([]);
      setIsDrawing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create route",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Routes Management</h2>
          <p className="text-muted-foreground">Create and manage transportation routes</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Route
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Create New Route</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Route name"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                  />
                  <Input
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsDrawing(!isDrawing)}
                      variant={isDrawing ? "destructive" : "default"}
                    >
                      {isDrawing ? 'Stop Drawing' : 'Start Drawing'}
                    </Button>
                    <Button onClick={handleSave} disabled={!routeName || coordinates.length < 2}>
                      Save Route
                    </Button>
                  </div>
                  
                  <div className="h-[400px] rounded-md border">
                    <LeafletMap
                      center={[0, 0]}
                      zoom={13}
                      onClick={handleMapClick}
                      markers={coordinates}
                      polyline={coordinates}
                    />
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card className="p-4">Loading routes...</Card>
        ) : routes?.map((route) => (
          <Card key={route.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">{route.name}</h3>
                <p className="text-sm text-muted-foreground">{route.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  route.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {route.status}
                </span>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
