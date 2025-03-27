import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

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
  onClick?: (lat: number, lng: number) => void;
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
  return (
    <MapContainer 
      id={id}
      center={center}
      zoom={zoom} 
      className={`${className} w-full h-full min-h-[400px]`}
      onClick={(e: any) => onClick?.(e.latlng.lat, e.latlng.lng)}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© OpenStreetMap contributors'
      />

      {markers.map((marker, index) => (
        <Marker key={index} position={marker.position}>
          {marker.popup && <Popup>{marker.popup}</Popup>}
        </Marker>
      ))}

      {routes.map((route, index) => (
        <Polyline
          key={index}
          positions={route.path}
          pathOptions={{
            color: route.color || '#FF0000',
            weight: route.weight || 3
          }}
        />
      ))}
    </MapContainer>
  );
}