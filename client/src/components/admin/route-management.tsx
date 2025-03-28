import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Plus, Edit, Trash } from 'lucide-react';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import RouteCreator from './route-creator';
import { useApi } from '@/hooks/use-api';
import type { Route } from '@shared/schema';

export default function RouteManagement() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { get, del } = useApi();

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    const data = await get<Route[]>('/api/routes');
    if (data) setRoutes(data);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      await del(`/api/routes/${id}`);
      loadRoutes();
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Route Management</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Route
        </Button>
      </div>

      <div className="grid gap-4">
        {routes.map((route) => (
          <Card key={route.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{route.name}</h3>
                <p className="text-sm text-gray-500">{route.description}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(route.id)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Route</DialogTitle>
          </DialogHeader>
          <RouteCreator onSuccess={() => {
            setIsCreateModalOpen(false);
            loadRoutes();
          }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}