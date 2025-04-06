import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LeafletMap from '@/lib/leaflet-map';
import { apiRequest } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from 'lucide-react';
import type { Route } from '@shared/schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


interface RouteCreatorProps {
  onEdit?: Route | null;
  onEditComplete?: () => void;
}

export default function RouteCreator({ onEdit, onEditComplete }: RouteCreatorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [description, setDescription] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [frequency, setFrequency] = useState('15');
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles', 'active'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/vehicles/active');
      const data = await res.json();
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  useEffect(() => {
    if (onEdit?.vehicleId) {
      setSelectedVehicle(onEdit.vehicleId.toString());
    }
  }, [onEdit]);

  useEffect(() => {
    if (onEdit) {
      setIsDialogOpen(true);
      setRouteName(onEdit.name);
      setDescription(onEdit.description || '');
      setStartLocation(onEdit.startLocation);
      setEndLocation(onEdit.endLocation);
      setFrequency(onEdit.frequency.toString());
      if (onEdit.waypoints) {
        setCoordinates(onEdit.waypoints.map(wp => [parseFloat(wp.split(',')[0]), parseFloat(wp.split(',')[1])]));
      }
      setSelectedVehicle(onEdit.vehicleId ? onEdit.vehicleId.toString() : ''); // Assuming vehicleId exists
    }
  }, [onEdit]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/routes', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      resetForm();
      toast({
        title: "Ruta creada",
        description: "La ruta ha sido creada exitosamente.",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest('PUT', `/api/routes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      resetForm();
      if (onEditComplete) onEditComplete();
      toast({
        title: "Ruta actualizada",
        description: "La ruta ha sido actualizada exitosamente.",
      });
    }
  });

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (!isDrawing) return;
    setCoordinates(prev => [...prev, [lat, lng]]);
  }, [isDrawing]);

  const resetForm = () => {
    setIsDialogOpen(false);
    setRouteName('');
    setDescription('');
    setStartLocation('');
    setEndLocation('');
    setFrequency('15');
    setCoordinates([]);
    setIsDrawing(false);
    setSelectedVehicle('');
  };

  const handleSubmit = async () => {
    if (!coordinates.length) {
      alert('Please add some waypoints to the route');
      return;
    }

    if (!selectedVehicle) {
      alert('Please select a vehicle for this route');
      return;
    }

    // Validaciones
    if (!routeName || !startLocation || !endLocation || !frequency) {
      toast({
        title: "Error de validación",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    if (coordinates.length < 2) {
      toast({
        title: "Error de validación",
        description: "Por favor defina al menos dos puntos en la ruta",
        variant: "destructive"
      });
      return;
    }

    try {
      const data = {
        name: routeName,
        description,
        startLocation,
        endLocation,
        frequency: parseInt(frequency),
        waypoints: coordinates.map(coord => `${coord[0]},${coord[1]}`),
        status: 'active',
        vehicleId: selectedVehicle ? parseInt(selectedVehicle) : undefined
      };

      if (onEdit) {
        await updateMutation.mutate({ id: onEdit.id, data });
        toast({
          title: "Ruta actualizada",
          description: "Los datos de la ruta se actualizaron correctamente"
        });
      } else {
        await createMutation.mutate(data);
        toast({
          title: "Ruta creada",
          description: "La nueva ruta se agregó correctamente"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al procesar la operación",
        variant: "destructive"
      });
      console.error('Error:', error);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {onEdit ? 'Editar Ruta' : 'Nueva Ruta'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{onEdit ? 'Editar Ruta' : 'Crear Nueva Ruta'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Nombre de la ruta"
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
          />
          <Textarea
            placeholder="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            placeholder="Ubicación inicial"
            value={startLocation}
            onChange={(e) => setStartLocation(e.target.value)}
          />
          <Input
            placeholder="Ubicación final"
            value={endLocation}
            onChange={(e) => setEndLocation(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Frecuencia (minutos)"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          />
          <div className="space-y-2">
            <label className="text-sm font-medium">Vehículo</label>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar vehículo" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.length === 0 ? (
                  <SelectItem value="no-vehicles" disabled>No hay vehículos disponibles</SelectItem>
                ) : (
                  vehicles.map((vehicle) => (
                    <SelectItem 
                      key={vehicle.id} 
                      value={vehicle.id.toString()}
                    >
                      Unidad #{vehicle.id} - Cap: {vehicle.capacity}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="h-[400px] rounded-md border">
            <LeafletMap
              center={[25.761681, -80.191788]}
              zoom={13}
              onClick={handleMapClick}
              markers={coordinates.map((coord, index) => ({
                position: coord,
                popup: `Punto ${index + 1}`,
                type: 'stop' as const
              }))}
              routes={coordinates.length >= 2 ? [{
                path: coordinates,
                color: '#0000FF',
                weight: 3
              }] : []}
            />
          </div>
          <div className="flex justify-between">
            <Button
              type="button"
              variant={isDrawing ? "destructive" : "outline"}
              onClick={() => setIsDrawing(!isDrawing)}
            >
              {isDrawing ? 'Detener Dibujo' : 'Iniciar Dibujo'}
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {onEdit ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}