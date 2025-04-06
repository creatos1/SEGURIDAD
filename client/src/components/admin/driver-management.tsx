import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Plus, Edit, Trash } from 'lucide-react';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';

export default function DriverManagement() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'driver' as const
  });

  const { get, post, put, del } = useApi();

  const loadDrivers = async () => {
    try {
      const data = await get<User[]>('/api/users?role=driver');
      setDrivers(data);
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los conductores",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleEdit = (driver: User) => {
    setEditingDriver(driver);
    setFormData({
      username: driver.username,
      email: driver.email,
      password: '',
      fullName: driver.fullName || '',
      role: 'driver'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingDriver) {
        // Update existing driver
        await put(`/api/users/${editingDriver.id}`, formData);
        toast({
          title: "Conductor actualizado",
          description: "Los datos del conductor se actualizaron correctamente"
        });
      } else {
        // Create new driver
        await post('/api/users', formData);
        toast({
          title: "Conductor creado",
          description: "El nuevo conductor se agregó correctamente"
        });
      }

      await loadDrivers();
      setIsModalOpen(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        fullName: '',
        role: 'driver'
      });
      setEditingDriver(null);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Hubo un error al procesar la operación",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este conductor?')) {
      try {
        await del(`/api/users/${id}`);
        await loadDrivers();
        toast({
          title: "Conductor eliminado",
          description: "El conductor se eliminó correctamente"
        });
      } catch (error) {
        console.error('Error deleting driver:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el conductor",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestión de Conductores</h1>
        <Button onClick={() => {
          setFormData({
            username: '',
            email: '',
            password: '',
            fullName: '',
            role: 'driver'
          });
          setEditingDriver(null);
          setIsModalOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Conductor
        </Button>
      </div>

      <div className="grid gap-4">
        {drivers.map((driver) => (
          <Card key={driver.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{driver.fullName || driver.username}</h3>
                <p className="text-sm text-gray-500">{driver.email}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(driver)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(driver.id)}>
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
            <DialogTitle>{editingDriver ? 'Editar Conductor' : 'Agregar Nuevo Conductor'}</DialogTitle>
            <DialogDescription>
              {editingDriver ? 'Edita la información del conductor.' : 'Completa los detalles para agregar un nuevo conductor.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="Nombre de usuario"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
              />
            </div>
            <div>
              <Input
                placeholder="Nombre completo"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required
              />
            </div>
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Contraseña"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required={!editingDriver}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? 'Guardando...' 
                : (editingDriver ? 'Actualizar Conductor' : 'Agregar Conductor')
              }
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}