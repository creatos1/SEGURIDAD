import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Plus, Edit, Trash, Star } from 'lucide-react';
import { Card } from '../ui/card';
import { useApi } from '@/hooks/use-api';
import type { User } from '@shared/schema';

export default function DriverManagement() {
  const [drivers, setDrivers] = useState<User[]>([]);
  const { get } = useApi();

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    const data = await get<User[]>('/api/users?role=driver');
    if (data) setDrivers(data);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Driver Management</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Driver
        </Button>
      </div>

      <div className="grid gap-4">
        {drivers.map((driver) => (
          <Card key={driver.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{driver.username}</h3>
                <p className="text-sm text-gray-500">{driver.email}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Star className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
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