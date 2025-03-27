
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Loader } from "lucide-react";
import RouteCreator from "@/components/admin/route-creator";

export default function RoutesPage() {
  const { data: routes, isLoading } = useQuery({
    queryKey: ['/api/routes'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/routes');
      return res.json();
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
      <h1 className="text-2xl font-bold mb-6">Route Management</h1>
      <RouteCreator />
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Existing Routes</h2>
        <div className="grid gap-4">
          {routes?.map((route: any) => (
            <div key={route.id} className="p-4 border rounded-lg">
              <h3 className="font-medium">{route.name}</h3>
              <p className="text-sm text-muted-foreground">{route.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
