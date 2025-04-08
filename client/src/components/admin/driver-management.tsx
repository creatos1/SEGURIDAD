
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
    name: '',
    role: 'DRIVER'
  });

  const { get, post, put, del } = useApi();
  const { toast } = useToast();

  const loadDrivers = async () => {
    try {
      const response = await get('/api/users', { role: 'DRIVER' });
      if (Array.isArray(response)) {
        setDrivers(response);
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingDriver) {
        // Actualizar conductor existente
        const updateData = {
          username: formData.username,
          email: formData.email,
          fullName: formData.name,
          role: 'DRIVER'
        };

        if (formData.password) {
          updateData.password = formData.password;
        }

        await put(`/api/users/${editingDriver.id}`, updateData);
        toast({
          title: "Éxito",
          description: "Conductor actualizado correctamente"
        });
      } else {
        // Crear nuevo conductor
        await post('/api/users', {
          ...formData,
          role: 'DRIVER'
        });
        toast({
          title: "Éxito",
          description: "Conductor creado correctamente"
        });
      }

      // Limpiar formulario y cerrar modal
      setFormData({
        username: '',
        email: '',
        password: '',
        name: '',
        role: 'DRIVER'
      });
      setEditingDriver(null);
      setIsModalOpen(false);
      
      // Recargar lista de conductores
      await loadDrivers();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Hubo un error al procesar la operación",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      username: driver.username,
      email: driver.email,
      password: '',
      name: driver.fullName || '',
      role: 'DRIVER'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este conductor?')) {
      try {
        await del(`/api/users/${id}`);
        toast({
          title: "Éxito",
          description: "Conductor eliminado correctamente"
        });
        await loadDrivers();
      } catch (error) {
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
          setEditingDriver(null);
          setFormData({
            username: '',
            email: '',
            password: '',
            name: '',
            role: 'DRIVER'
          });
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
                <h3 className="font-semibold">{driver.fullName}</h3>
                <p className="text-sm text-gray-500">{driver.email}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(driver)}
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
