
import React, { useState, useEffect } from 'react';
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

export default function DriverManagement() {
  const [drivers, setDrivers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: ''
  });
  const { get, post, put, del } = useApi();
  const { toast } = useToast();

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const data = await get('/api/users', { role: 'DRIVER' });
      if (Array.isArray(data)) {
        const driversData = data.map(driver => ({
          ...driver,
          fullName: driver.name || driver.fullName
        }));
        setDrivers(driversData);
      } else {
        console.error('Unexpected response format:', data);
        toast({
          title: "Error",
          description: "Error en el formato de datos de conductores",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast({
        title: "Error",
        description: "Error al cargar conductores",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        fullName: formData.name,
        role: 'DRIVER'
      };
      
      if (editingDriver) {
        if (formData.password) {
          payload.password = formData.password;
        }
        const response = await put(`/api/users/${editingDriver.id}`, payload);
        if (!response) {
          throw new Error('Error al actualizar el conductor');
        }
        await loadDrivers(); // Aseguramos que se recargue la lista
        toast({
          title: "Conductor actualizado",
          description: "Los datos se actualizaron correctamente"
        });
      } else {
        await post('/api/users', payload);
        toast({
          title: "Conductor creado",
          description: "El nuevo conductor se agregó correctamente"
        });
      }
      setIsModalOpen(false);
      setEditingDriver(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        name: ''
      });
      await loadDrivers();
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
      if (window.confirm('¿Estás seguro de eliminar este conductor?')) {
        await del(`/api/users/${id}`);
        toast({
          title: "Conductor eliminado",
          description: "El conductor se eliminó correctamente"
        });
        await loadDrivers();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el conductor",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestión de Conductores</h1>
        <Button onClick={() => {
          setEditingDriver(null);
          setFormData({
            username: '',
            email: '',
            password: '',
            name: ''
          });
          setIsModalOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Conductor
        </Button>
      </div>

      <div className="grid gap-4">
        {drivers.map((driver: any) => (
          <Card key={driver.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{driver.fullName || driver.name}</h3>
                <p className="text-sm text-gray-500">{driver.email}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingDriver(driver);
                    setFormData({
                      username: driver.username,
                      email: driver.email,
                      password: '',
                      name: driver.fullName || driver.name
                    });
                    setIsModalOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(driver.id)}
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
              {editingDriver ? 'Editar Conductor' : 'Agregar Conductor'}
            </DialogTitle>
            <DialogDescription>
              Complete los datos del conductor
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Nombre completo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              placeholder="Usuario"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              type="password"
              placeholder="Contraseña"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingDriver}
            />
            <Button type="submit" className="w-full">
              {editingDriver ? 'Actualizar' : 'Crear'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
