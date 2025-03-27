
import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/ui/container";
import { RouteCard } from "@/components/route-card";
import type { Route } from "@shared/schema";

export default function RoutesPage() {
  const { data: routes = [] } = useQuery<Route[]>({
    queryKey: ["routes"],
    queryFn: () => fetch("/api/routes").then(res => res.json())
  });

  return (
    <Container>
      <h1 className="text-2xl font-bold mb-4">Rutas</h1>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {routes.map(route => (
          <RouteCard key={route.id} route={route} />
        ))}
      </div>
    </Container>
  );
}
