import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Marker {
  position: [number, number];
  type: 'driver' | 'stop' | 'current';
  popup?: string;
}

interface Route {
  path: [number, number][];
  color?: string;
  weight?: number;
}

interface LeafletMapProps {
  id: string;
  center: [number, number];
  zoom: number;
  markers?: Marker[];
  routes?: Route[];
  className?: string;
  onClick?: (latlng: [number, number]) => void;
}

export default function LeafletMap({
  id,
  center,
  zoom,
  markers = [],
  routes = [],
  className = "",
  onClick
}: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routesRef = useRef<L.Polyline[]>([]);

  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map(id).setView(center, zoom);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      if (onClick) {
        map.on('click', (e) => {
          onClick([e.latlng.lat, e.latlng.lng]);
        });
      }

      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [id]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(marker => {
      const newMarker = L.marker(marker.position)
        .addTo(mapRef.current!);
      
      if (marker.popup) {
        newMarker.bindPopup(marker.popup);
      }
      
      markersRef.current.push(newMarker);
    });
  }, [markers]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing routes
    routesRef.current.forEach(route => route.remove());
    routesRef.current = [];

    // Add new routes
    routes.forEach(route => {
      const polyline = L.polyline(route.path, {
        color: route.color || '#FF0000',
        weight: route.weight || 3
      }).addTo(mapRef.current!);
      
      routesRef.current.push(polyline);
    });
  }, [routes]);

  return <div id={id} className={`${className} w-full h-full`} />;
}

interface LeafletMapProps {
  id: string;
  center: [number, number];
  zoom: number;
  markers?: Marker[];
  routes?: Route[];
}

export default function LeafletMap({ id, center, zoom, markers = [], routes = [] }: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize map
    const map = L.map(containerRef.current).setView(center, zoom);
    mapRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Cleanup on unmount
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Update markers
    markers.forEach(marker => {
      L.marker(marker.position)
        .bindPopup(marker.popup || '')
        .addTo(map);
    });

    // Update routes
    routes.forEach(route => {
      L.polyline(route.path, {
        color: route.color || '#FF0000',
        weight: 3
      }).addTo(map);
    });

  }, [markers, routes]);

  return (
    <div 
      ref={containerRef} 
      id={id} 
      className="w-full h-[500px] rounded-lg overflow-hidden"
    />
  );
}