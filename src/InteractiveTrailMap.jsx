import React, { useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Tooltip,
  CircleMarker,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './InteractiveTrailMap.css';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Start marker - green
const startIcon = new L.DivIcon({
  className: 'trail-custom-marker',
  html: '<div class="marker-pin start-pin"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// End marker - red
const endIcon = new L.DivIcon({
  className: 'trail-custom-marker',
  html: '<div class="marker-pin end-pin"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const InteractiveTrailMap = ({ trailData, fallbackImage }) => {
  const [mapError, setMapError] = useState(false);

  if (
    mapError ||
    !trailData ||
    !trailData.routePoints ||
    trailData.routePoints.length === 0
  ) {
    return (
      <div className="trail-map-fallback">
        <img
          src={
            fallbackImage ||
            'https://via.placeholder.com/1200x400.png?text=Trail+Map+Preview'
          }
          alt="Trail route fallback"
          className="fallback-image"
        />
        <div className="fallback-overlay">
          <span>Interactive map unavailable. Showing static route.</span>
        </div>
      </div>
    );
  }

  const { routePoints } = trailData;
  const positions = routePoints.map((point) => [point.lat, point.lng]);

  const startPoint = routePoints[0];
  const endPoint = routePoints[routePoints.length - 1];

  const centerLat = (startPoint.lat + endPoint.lat) / 2;
  const centerLng = (startPoint.lng + endPoint.lng) / 2;

  return (
    <div className="interactive-trail-map-container">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        scrollWheelZoom={true}
        className="leaflet-map-element"
        whenReady={(event) => {
          const map = event.target;
          const bounds = L.latLngBounds(positions);
          map.fitBounds(bounds, { padding: [40, 40] });
        }}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
          attribution='Tiles &copy; Esri'
          eventHandlers={{
            tileerror: () => setMapError(true),
          }}
        />

        <Polyline
          positions={positions}
          pathOptions={{
            color: '#2563eb',
            weight: 4,
            opacity: 0.85,
          }}
        />

        <Marker position={[startPoint.lat, startPoint.lng]} icon={startIcon}>
          <Tooltip direction="top" offset={[0, -12]}>
            <strong>Start Point</strong>
          </Tooltip>
        </Marker>

        <Marker position={[endPoint.lat, endPoint.lng]} icon={endIcon}>
          <Tooltip direction="top" offset={[0, -12]}>
            <strong>End Point</strong>
          </Tooltip>
        </Marker>

        {routePoints.map((point, index) => (
          <CircleMarker
            key={index}
            center={[point.lat, point.lng]}
            radius={6}
            pathOptions={{
              color: 'transparent',
              fillColor: 'transparent',
              fillOpacity: 0,
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
              <div className="trail-tooltip">
                <strong>Elevation:</strong> {point.elevation} m
                <br />
                <strong>Distance from start:</strong> {point.distance} km
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

export default InteractiveTrailMap;