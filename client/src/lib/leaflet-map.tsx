import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Marker {
  position: [number, number];
  type: 'driver' | 'stop';
  popup?: string;
}

interface Route {
  path: [number, number][];
  color?: string;
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