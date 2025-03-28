import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Plus, Edit, Trash, Home } from 'lucide-react';
import { Card } from '../ui/card';
import { useApi } from '@/hooks/use-api';
import type { Vehicle } from '@shared/schema';

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const { get, del } = useApi();

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    const data = await get<Vehicle[]>('/api/vehicles');
    if (data) setVehicles(data);
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
        <Button onClick={() => window.location.href = '/'} >
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      <div className="grid gap-4">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{vehicle.vehicleNumber}</h3>
                <p className="text-sm text-gray-500">{vehicle.vehicleType} - {vehicle.status}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
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
    </div>
  );
}