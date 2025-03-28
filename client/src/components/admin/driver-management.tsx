
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Plus, Edit, Trash, Star, Home } from 'lucide-react';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { useApi } from '@/hooks/use-api';
import type { User } from '@shared/schema';

export default function DriverManagement() {
  const [drivers, setDrivers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: ''
  });
  
  const { get, post, put, del } = useApi();

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    const data = await get<User[]>('/api/users?role=driver');
    if (data) setDrivers(data);
  };

  const handleEdit = (driver: User) => {
    setEditingDriver(driver);
    setFormData({
      username: driver.username,
      email: driver.email,
      password: '',
      fullName: driver.fullName || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      role: 'driver'
    };

    if (editingDriver) {
      await put(`/api/users/${editingDriver.id}`, payload);
    } else {
      await post('/api/users', payload);
    }

    setIsModalOpen(false);
    setEditingDriver(null);
    loadDrivers();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      await del(`/api/users/${id}`);
      loadDrivers();
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Driver Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.replace('/')}>
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
          <Button onClick={() => {
            setFormData({
              username: '',
              email: '',
              password: '',
              fullName: ''
            });
            setIsModalOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Driver
          </Button>
        </div>
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
            <DialogTitle>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="Username"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
            <div>
              <Input
                placeholder="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              />
            </div>
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <Button type="submit" className="w-full">
              {editingDriver ? 'Update Driver' : 'Add Driver'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
