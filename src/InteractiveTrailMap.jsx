import React, { useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Tooltip,
  CircleMarker,
  Popup
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

const poiIcons = {
  food: new L.DivIcon({ className: 'poi-marker food', html: '🍔', iconSize: [30, 30] }),
  parking: new L.DivIcon({ className: 'poi-marker parking', html: '🅿️', iconSize: [30, 30] }),
  viewpoint: new L.DivIcon({ className: 'poi-marker viewpoint', html: '📷', iconSize: [30, 30] }),
  fuel: new L.DivIcon({ className: 'poi-marker fuel', html: '⛽', iconSize: [30, 30] })
};

const InteractiveTrailMap = ({ trailData, fallbackImage }) => {
  const [mapError, setMapError] = useState(false);
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    food: false,
    parking: false,
    viewpoint: false,
    fuel: false
  });

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

  const handleLayerToggle = (layer) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleDirections = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank', 'noopener,noreferrer');
  };

  const anyLayerActive = activeLayers.food || activeLayers.parking || activeLayers.viewpoint || activeLayers.fuel;

  const normalizePoiType = (type) => {
    if (!type) return 'food';
    const lower = type.toLowerCase();
    if (lower.includes('food')) return 'food';
    if (lower.includes('park')) return 'parking';
    if (lower.includes('view')) return 'viewpoint';
    if (lower.includes('fuel')) return 'fuel';
    return lower;
  };

  return (
    <div className="interactive-trail-map-container" style={{ position: 'relative' }}>
      
      <div className="layers-control-container">
        <button className="layers-btn" onClick={() => setIsLayersPanelOpen(!isLayersPanelOpen)}>
          🗺️ Layers
        </button>

        {isLayersPanelOpen && (
          <>
            <div className="layers-backdrop" onClick={() => setIsLayersPanelOpen(false)}></div>
            <div className="layers-panel">
              <button className="layers-panel-close" onClick={() => setIsLayersPanelOpen(false)}>×</button>
              <h4 style={{margin: '0 0 10px 0'}}>Map Layers</h4>
            <label className="layer-toggle">
              <input type="checkbox" checked={activeLayers.food} onChange={() => handleLayerToggle('food')} />
              <span className="layer-icon">🍔</span> Food
            </label>
            <label className="layer-toggle">
              <input type="checkbox" checked={activeLayers.parking} onChange={() => handleLayerToggle('parking')} />
              <span className="layer-icon">🅿️</span> Parking
            </label>
            <label className="layer-toggle">
              <input type="checkbox" checked={activeLayers.viewpoint} onChange={() => handleLayerToggle('viewpoint')} />
              <span className="layer-icon">📷</span> Viewpoints
            </label>
            <label className="layer-toggle">
              <input type="checkbox" checked={activeLayers.fuel} onChange={() => handleLayerToggle('fuel')} />
              <span className="layer-icon">⛽</span> Fuel
            </label>
          </div>
          </>
        )}
      </div>

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

        {!anyLayerActive && (
          <>
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
          </>
        )}

        {trailData.pois && trailData.pois
          .filter((poi) => activeLayers[normalizePoiType(poi.type)])
          .map((poi) => {
            const mappedType = normalizePoiType(poi.type);
            const icon = poiIcons[mappedType] || poiIcons.food; // fallback
            return (
              <Marker key={poi.id} position={[poi.lat, poi.lng]} icon={icon}>
                <Popup>
                  <div className="poi-popup">
                    <h3>{poi.name}</h3>
                    <p><strong>Type:</strong> {mappedType.charAt(0).toUpperCase() + mappedType.slice(1)}</p>
                    <p><strong>Distance:</strong> {poi.distance} km</p>
                    <button className="poi-directions-btn" onClick={() => handleDirections(poi.lat, poi.lng)}>
                      Get Directions
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

      </MapContainer>
    </div>
  );
};

export default InteractiveTrailMap;