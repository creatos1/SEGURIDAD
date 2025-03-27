
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Loader, Pencil, Trash } from "lucide-react";
import RouteCreator from "@/components/admin/route-creator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export default function RoutesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [routeToDelete, setRouteToDelete] = useState<number | null>(null);
  const [editingRoute, setEditingRoute] = useState<any | null>(null);

  const { data: routes, isLoading } = useQuery({
    queryKey: ['/api/routes'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/routes');
      return res.json();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/routes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      toast({
        title: "Ruta eliminada",
        description: "La ruta ha sido eliminada exitosamente.",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Rutas</h1>
        <RouteCreator 
          onEdit={editingRoute} 
          onEditComplete={() => setEditingRoute(null)}
        />
      </div>
      
      <div className="grid gap-4">
        {routes?.map((route: any) => (
          <div key={route.id} className="p-4 border rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{route.name}</h3>
                <p className="text-sm text-muted-foreground">{route.description}</p>
                <div className="mt-2 text-sm">
                  <p>Inicio: {route.startLocation}</p>
                  <p>Fin: {route.endLocation}</p>
                  <p>Frecuencia: {route.frequency} min</p>
                  <p>Estado: {route.status}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setEditingRoute(route)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setRouteToDelete(route.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!routeToDelete} onOpenChange={() => setRouteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La ruta será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (routeToDelete) {
                deleteMutation.mutate(routeToDelete);
                setRouteToDelete(null);
              }
            }}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
