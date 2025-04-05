import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Plus, Edit, Trash, Home } from 'lucide-react';
import { Card } from '../ui/card';
import { useApi } from '@/hooks/use-api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import type { Vehicle } from '@shared/schema';
import { toast } from '@/components/ui/use-toast'; // Assuming a toast component exists

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

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    const data = await get<Vehicle[]>('/api/vehicles');
    if (data) setVehicles(data);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicleNumber: vehicle.vehicleNumber,
      vehicleType: vehicle.vehicleType,
      capacity: vehicle.capacity.toString(),
      status: vehicle.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.vehicleNumber || !formData.vehicleType || !formData.capacity) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive"
      });
      return;
    }

    const payload = {
      vehicleNumber: formData.vehicleNumber,
      vehicleType: formData.vehicleType,
      capacity: parseInt(formData.capacity),
      status: formData.status
    };

    try {
      if (editingVehicle) {
        await put(`/api/vehicles/${editingVehicle.id}`, payload);
        toast({
          title: "Éxito",
          description: "Vehículo actualizado correctamente"
        });
      } else {
        await post('/api/vehicles', payload);
        toast({
          title: "Éxito",
          description: "Vehículo creado correctamente"
        });
      }

      setIsModalOpen(false);
      setEditingVehicle(null);
      loadVehicles();
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast({
          title: "Error",
          description: "El número de vehículo ya existe",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Hubo un error al procesar la operación",
          variant: "destructive"
        });
      }
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      await del(`/api/vehicles/${id}`);
      loadVehicles();
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Vehicle Management</h1>
        <div className="flex gap-2">
          <Button onClick={() => window.location.href = '/'}>
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
          <Button onClick={() => {
            setFormData({
              vehicleNumber: '',
              vehicleType: '',
              capacity: '',
              status: 'active'
            });
            setIsModalOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{vehicle.vehicleNumber}</h3>
                <p className="text-sm text-gray-500">
                  {vehicle.vehicleType} - Capacity: {vehicle.capacity} - Status: {vehicle.status}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(vehicle)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(vehicle.id)}>
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
            <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="Vehicle Number"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
              />
            </div>
            <div>
              <Input
                placeholder="Vehicle Type"
                value={formData.vehicleType}
                onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Capacity"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
              />
            </div>
            <div>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}