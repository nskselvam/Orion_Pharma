import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { BatchStage } from './types';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  stages: BatchStage[];
  height?: string;
}

// Component to automatically fit bounds
const MapBounds: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);

  return null;
};

const MapView: React.FC<MapViewProps> = ({ stages, height = '500px' }) => {
  const [mapReady, setMapReady] = useState(false);

  // Extract coordinates from stages
  const positions: [number, number][] = stages
    .filter(stage => stage.coordinates)
    .map(stage => [stage.coordinates!.lat, stage.coordinates!.lng] as [number, number]);

  // Default center if no positions
  const defaultCenter: [number, number] = [20, 0];
  const center = positions.length > 0 ? positions[0] : defaultCenter;

  const getMarkerColor = (status: BatchStage['status']): string => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'current':
        return 'blue';
      case 'pending':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const createCustomIcon = (status: BatchStage['status']) => {
    const color = getMarkerColor(status);
    return L.divIcon({
      className: 'custom-icon',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${color === 'green' ? '#34c759' : color === 'blue' ? '#0071e3' : '#86868b'};
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  useEffect(() => {
    setMapReady(true);
  }, []);

  if (!mapReady) {
    return (
      <div className="card" style={{ height }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', height }}>
      {positions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🗺️</div>
          <div className="empty-state-title">No Location Data</div>
          <div className="empty-state-text">Location tracking will appear here</div>
        </div>
      ) : (
        <MapContainer
          center={center}
          zoom={6}
          style={{ height: '100%', width: '100%', borderRadius: '18px' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Draw route polyline */}
          {positions.length > 1 && (
            <Polyline
              positions={positions}
              color="#0071e3"
              weight={3}
              opacity={0.7}
              dashArray="10, 10"
            />
          )}

          {/* Add markers for each stage */}
          {stages
            .filter(stage => stage.coordinates)
            .map((stage, index) => (
              <Marker
                key={index}
                position={[stage.coordinates!.lat, stage.coordinates!.lng]}
                icon={createCustomIcon(stage.status)}
              >
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <strong style={{ fontSize: '15px' }}>{stage.stage}</strong>
                    <div style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                      <div>📍 {stage.location}</div>
                      <div>🌡️ {stage.temperature}°C</div>
                      <div>
                        📅 {new Date(stage.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <span
                        className={`badge ${
                          stage.status === 'completed'
                            ? 'badge-success'
                            : stage.status === 'current'
                            ? 'badge-info'
                            : 'badge-warning'
                        }`}
                      >
                        {stage.status}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          <MapBounds positions={positions} />
        </MapContainer>
      )}
    </div>
  );
};

export default MapView;
