
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import LeafletMap from '@/lib/leaflet-map';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function RouteCreator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [routeName, setRouteName] = useState('');
  const [description, setDescription] = useState('');
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleMapClick = useCallback((e: { latlng: { lat: number; lng: number } }) => {
    if (!isDrawing) return;
    setCoordinates(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
  }, [isDrawing]);

  const handleSave = async () => {
    if (!routeName || coordinates.length < 2) {
      toast({
        title: "Error",
        description: "Please provide a route name and at least 2 points",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: routeName,
          description,
          startLocation: `${coordinates[0][0]},${coordinates[0][1]}`,
          endLocation: `${coordinates[coordinates.length-1][0]},${coordinates[coordinates.length-1][1]}`,
          coordinates: coordinates.map(coord => `${coord[0]},${coord[1]}`),
          frequency: 15,
          status: 'active'
        })
      });

      if (!response.ok) throw new Error('Failed to create route');

      await queryClient.invalidateQueries({ queryKey: ['/api/routes'] });

      toast({
        title: "Success",
        description: "Route created successfully"
      });

      // Reset form
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
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
        <div className="flex-1 space-y-4">
          <Input 
            placeholder="Route name"
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
          />
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-x-2">
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
      </div>

      <LeafletMap
        id="route-creator"
        center={[25.761681, -80.191788]}
        zoom={13}
        markers={coordinates.map((coord, i) => ({
          position: coord,
          type: i === 0 ? 'start' : i === coordinates.length - 1 ? 'end' : 'stop',
          popup: i === 0 ? 'Start' : i === coordinates.length - 1 ? 'End' : `Point ${i}`
        }))}
        routes={[
          {
            path: coordinates,
            color: '#3f51b5',
            weight: 3
          }
        ]}
        onClick={handleMapClick}
        className="h-[600px] rounded-lg border"
      />
    </div>
  );
}
