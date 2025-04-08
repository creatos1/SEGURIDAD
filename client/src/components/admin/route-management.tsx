import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Plus, Edit, Trash, Home, Eye } from 'lucide-react';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import RouteCreator from './route-creator';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import type { Route } from '@shared/schema';

export default function RouteManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const { get, post, put, del } = useApi();
  const { toast } = useToast();
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    loadRoutes();
    loadVehicles();
  }, []);

  const loadRoutes = async () => {
    const data = await get<Route[]>('/api/routes');
    if (data) setRoutes(data);
  };

  const loadVehicles = async () => {
    const data = await get('/api/vehicles');
    if (data) setVehicles(data);
  };

  const handleEdit = (route) => {
    setEditingRoute(route);
    setSelectedVehicles(route.vehicles || []);
    setIsCreateModalOpen(true);
  };

  const handleSave = async (routeData) => {
    try {
      const payload = { ...routeData, vehicles: selectedVehicles };
      if (editingRoute) {
        await put(`/api/routes/${editingRoute.id}`, payload);
        toast({
          title: "Ruta actualizada",
          description: "La ruta se actualizó correctamente"
        });
      } else {
        await post('/api/routes', payload);
        toast({
          title: "Ruta creada",
          description: "La ruta se creó correctamente"
        });
      }
      setIsCreateModalOpen(false);
      setEditingRoute(null);
      await loadRoutes();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error en la operación",
        variant: "destructive"
      });
    }
  };

  const [routeToDelete, setRouteToDelete] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    setRouteToDelete(id);
  };

  const confirmDelete = async () => {
    if (!routeToDelete) return;
    try {
      await del(`/api/routes/${routeToDelete}`);
      await loadRoutes(); // Recargar todas las rutas
      toast({
        title: "Ruta eliminada",
        description: "La ruta se eliminó correctamente"
      });
    } catch {
      // Silently fail and reload routes anyway
      await loadRoutes();
    }
    setRouteToDelete(null);
  };

  const handleUpdate = async (id: number, data: any) => {
    try {
      await put(`/api/routes/${id}`, data);
      toast({
        title: "Ruta actualizada",
        description: "La ruta se actualizó correctamente"
      });
      loadRoutes();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar la ruta",
        variant: "destructive"
      });
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
        <Button variant="outline" onClick={() => window.location.replace('/')}>
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
      </div>

      <div className="grid gap-4">
        {routes.map((route) => (
          <Card key={route.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{route.name}</h3>
                <p className="text-sm text-gray-500">{route.description}</p>
                <p>Vehicle: {route.vehicleId ? `#${route.vehicleId}` : 'None'}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" 
                  onClick={() => {
                    toast({
                      title: "Route Details",
                      description: (
                        <div className="mt-2 space-y-2">
                          <p><strong>Name:</strong> {route.name}</p>
                          <p><strong>Description:</strong> {route.description}</p>
                          <p><strong>Start Location:</strong> {route.startLocation}</p>
                          <p><strong>End Location:</strong> {route.endLocation}</p>
                          <p><strong>Frequency:</strong> {route.frequency} min</p>
                          <p><strong>Status:</strong> {route.status}</p>
                          <p><strong>Vehicle ID:</strong> {route.vehicleId || 'None'}</p>
                        </div>
                      ),
                      duration: 5000,
                    });
                  }}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(route)}>
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
            <DialogTitle>{editingRoute ? 'Edit Route' : 'Create New Route'}</DialogTitle>
          </DialogHeader>
          <RouteCreator 
            vehicles={vehicles} 
            selectedVehicles={selectedVehicles} 
            setSelectedVehicles={setSelectedVehicles}
            onSave={handleSave} 
            initialRoute={editingRoute}
            onCancel={() => setIsCreateModalOpen(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!routeToDelete} onOpenChange={() => setRouteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}