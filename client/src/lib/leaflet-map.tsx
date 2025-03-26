import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Make sure Leaflet's default icon images are properly loaded
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix the default icon issue with Leaflet in React
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

type MapProps = {
  id: string;
  center: [number, number];
  zoom: number;
  markers?: Array<{
    position: [number, number];
    popup?: string;
    icon?: L.Icon;
    type: 'driver' | 'stop' | 'current';
  }>;
  routes?: Array<{
    path: [number, number][];
    color: string;
    weight?: number;
  }>;
  className?: string;
  onMapReady?: (map: L.Map) => void;
};

export default function LeafletMap({
  id,
  center,
  zoom,
  markers = [],
  routes = [],
  className = "h-96",
  onMapReady
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routesRef = useRef<L.Polyline[]>([]);

  useEffect(() => {
    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      const mapInstance = L.map(id).setView(center, zoom);
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance);
      
      mapRef.current = mapInstance;
      
      if (onMapReady) {
        onMapReady(mapInstance);
      }
    } else {
      // Update center and zoom if map already exists
      mapRef.current.setView(center, zoom);
    }

    // Clean up function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [id, center, zoom, onMapReady]);

  // Handle markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(marker => {
      const icon = marker.icon || createMarkerIcon(marker.type);
      const newMarker = L.marker(marker.position, { icon }).addTo(mapRef.current!);
      
      if (marker.popup) {
        newMarker.bindPopup(marker.popup);
      }
      
      markersRef.current.push(newMarker);
    });
  }, [markers]);

  // Handle routes
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old routes
    routesRef.current.forEach(route => route.remove());
    routesRef.current = [];

    // Add new routes
    routes.forEach(route => {
      const polyline = L.polyline(route.path, {
        color: route.color,
        weight: route.weight || 5,
        opacity: 0.7
      }).addTo(mapRef.current!);
      
      routesRef.current.push(polyline);
    });
  }, [routes]);

  return <div id={id} className={className}></div>;
}

// Create custom icons based on marker type
function createMarkerIcon(type: 'driver' | 'stop' | 'current'): L.Icon {
  let iconUrl, iconSize: [number, number];
  
  switch (type) {
    case 'driver':
      return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: white; border-radius: 50%; padding: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="#ff9800">
                  <path d="M4 16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v8zm13.5-6c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm-9 0c.83 0 1.5.67 1.5 1.5S9.33 13 8.5 13 7 12.33 7 11.5 7.67 10 8.5 10z"/>
                  <path d="M4 18h16v2H4z"/>
                </svg>
              </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
    case 'stop':
      return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: white; border-radius: 50%; padding: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="#3f51b5">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
    case 'current':
      return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: white; border-radius: 50%; padding: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="#4caf50">
                  <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                </svg>
              </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
    default:
      return DefaultIcon;
  }
}
