
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
import type { Vehicle } from '@shared/schema';

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    vehicleType: '',
    capacity: '',
    status: 'active'
  });

  const { get, post, put, del } = useApi();
  const { toast } = useToast();

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    if (editingVehicle) {
      setFormData({
        vehicleNumber: editingVehicle.vehicleNumber,
        vehicleType: editingVehicle.vehicleType,
        capacity: editingVehicle.capacity.toString(),
        status: editingVehicle.status
      });
    }
  }, [editingVehicle]);

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

  const validateForm = () => {
    if (!formData.vehicleNumber.trim()) {
      throw new Error("El número de vehículo es requerido");
    }
    if (!formData.vehicleType.trim()) {
      throw new Error("El tipo de vehículo es requerido");
    }
    if (!formData.capacity || parseInt(formData.capacity) <= 0) {
      throw new Error("La capacidad debe ser un número positivo");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      validateForm();
      
      const payload = {
        vehicleNumber: formData.vehicleNumber,
        vehicleType: formData.vehicleType,
        capacity: parseInt(formData.capacity),
        status: formData.status
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
      resetForm();
      await loadVehicles();
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
        await loadVehicles();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar el vehículo",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      vehicleNumber: '',
      vehicleType: '',
      capacity: '',
      status: 'active'
    });
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestión de Vehículos</h1>
        <Button onClick={() => {
          setEditingVehicle(null);
          resetForm();
          setIsModalOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Vehículo
        </Button>
      </div>

      <div className="grid gap-4">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{vehicle.vehicleNumber}</h3>
                <p className="text-sm text-gray-500">Tipo: {vehicle.vehicleType}</p>
                <p className="text-sm text-gray-500">Capacidad: {vehicle.capacity}</p>
                <p className="text-sm text-gray-500">Estado: {vehicle.status}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingVehicle(vehicle);
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
              type="text"
              placeholder="Número de Vehículo"
              value={formData.vehicleNumber}
              onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
              required
            />
            <Input
              type="text"
              placeholder="Tipo de Vehículo"
              value={formData.vehicleType}
              onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
              required
            />
            <Input
              type="number"
              placeholder="Capacidad"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              required
              min="1"
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
