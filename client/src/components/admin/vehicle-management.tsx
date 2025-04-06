import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Plus, Edit, Trash } from 'lucide-react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useApi } from '@/hooks/use-api';
import { useToast } from '../ui/use-toast';

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    capacity: '',
    status: 'active'
  });
  const { get, post, put, del } = useApi();
  const { toast } = useToast();

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await get('/api/vehicles');
      setVehicles(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar vehículos",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        capacity: parseInt(formData.capacity)
      };

      if (editingVehicle) {
        await put(`/api/vehicles/${editingVehicle.id}`, payload);
        toast({
          title: "Vehículo actualizado",
          description: "Los datos se actualizaron correctamente"
        });
      } else {
        await post('/api/vehicles', payload);
        toast({
          title: "Vehículo creado",
          description: "El nuevo vehículo se agregó correctamente"
        });
      }
      setIsModalOpen(false);
      setEditingVehicle(null);
      loadVehicles();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar la operación",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      if (window.confirm('¿Estás seguro de eliminar este vehículo?')) {
        await del(`/api/vehicles/${id}`);
        toast({
          title: "Vehículo eliminado",
          description: "El vehículo se eliminó correctamente"
        });
        loadVehicles();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el vehículo",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestión de Vehículos</h1>
        <Button onClick={() => {
          setEditingVehicle(null);
          setFormData({
            capacity: '',
            status: 'active'
          });
          setIsModalOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Vehículo
        </Button>
      </div>

      <div className="grid gap-4">
        {vehicles.map((vehicle: any) => (
          <Card key={vehicle.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Vehículo #{vehicle.id}</h3>
                <p className="text-sm text-gray-500">Capacidad: {vehicle.capacity}</p>
                <p className="text-sm text-gray-500">Estado: {vehicle.status}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingVehicle(vehicle);
                    setFormData({
                      capacity: vehicle.capacity.toString(),
                      status: vehicle.status
                    });
                    setIsModalOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(vehicle.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? 'Editar Vehículo' : 'Agregar Vehículo'}
            </DialogTitle>
            <DialogDescription>
              Complete los datos del vehículo
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="number"
              placeholder="Capacidad"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              required
            />
            <Button type="submit" className="w-full">
              {editingVehicle ? 'Actualizar' : 'Crear'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}