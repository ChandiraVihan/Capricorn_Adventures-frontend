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
  const [showLayersPanel, setShowLayersPanel] = useState(false);
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
    <div className="interactive-trail-map-container">

      <button
        type="button"
        className="layers-toggle-btn"
        onClick={() => setShowLayersPanel(!showLayersPanel)}
      >
        🗺️ Layers
      </button>

      {showLayersPanel && (
        <>
          <div
            className="layers-overlay"
            onClick={() => setShowLayersPanel(false)}
          />

          <div className="layers-panel desktop-layers-panel">
            <div className="layers-panel-header">
              <h4>POI Layers</h4>
            </div>

            <div className="map-floating-chips">
              <label className={`map-chip ${activeLayers.food ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.food}
                  onChange={() => handleLayerToggle('food')}
                  className="hidden-checkbox"
                />
                  <span className="chip-icon">🍴</span> Food
              </label>

              <label className={`map-chip ${activeLayers.parking ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.parking}
                  onChange={() => handleLayerToggle('parking')}
                  className="hidden-checkbox"
                />
                <span className="chip-icon">🅿️</span> Parking
              </label>

              <label className={`map-chip ${activeLayers.viewpoint ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.viewpoint}
                  onChange={() => handleLayerToggle('viewpoint')}
                  className="hidden-checkbox"
                />
                <span className="chip-icon">📷</span> Viewpoints
              </label>

              <label className={`map-chip ${activeLayers.fuel ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.fuel}
                  onChange={() => handleLayerToggle('fuel')}
                  className="hidden-checkbox"
                />
                <span className="chip-icon">⛽</span> Fuel
              </label>
            </div>
          </div>

          <div className="layers-panel mobile-layers-sheet">
            <div className="sheet-handle" />

            <div className="layers-panel-header">
              <h4>POI Layers</h4>
              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setShowLayersPanel(false)}
              >
                ✕
              </button>
            </div>

            <div className="mobile-sheet-options">
              <label className={`map-chip ${activeLayers.food ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.food}
                  onChange={() => handleLayerToggle('food')}
                  className="hidden-checkbox"
                />
                  <span className="chip-icon">🍴</span> Food
              </label>

              <label className={`map-chip ${activeLayers.parking ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.parking}
                  onChange={() => handleLayerToggle('parking')}
                  className="hidden-checkbox"
                />
                <span className="chip-icon">🅿️</span> Parking
              </label>

              <label className={`map-chip ${activeLayers.viewpoint ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.viewpoint}
                  onChange={() => handleLayerToggle('viewpoint')}
                  className="hidden-checkbox"
                />
                <span className="chip-icon">📷</span> Viewpoints
              </label>

              <label className={`map-chip ${activeLayers.fuel ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={activeLayers.fuel}
                  onChange={() => handleLayerToggle('fuel')}
                  className="hidden-checkbox"
                />
                <span className="chip-icon">⛽</span> Fuel
              </label>
            </div>
          </div>
        </>
      )}

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
                      Directions
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