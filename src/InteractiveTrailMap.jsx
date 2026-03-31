import React, { useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './InteractiveTrailMap.css';

// Fix for default Leaflet icon paths in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom markers for Start (Green) and End (Red)
const startIcon = new L.DivIcon({
  className: 'trail-custom-marker start-marker',
  html: '<div class="marker-pin start-pin"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const endIcon = new L.DivIcon({
  className: 'trail-custom-marker end-marker',
  html: '<div class="marker-pin end-pin"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const InteractiveTrailMap = ({ trailData, fallbackImage }) => {
  const [mapError, setMapError] = useState(false);

  // If no trail data provided or map failed to load, show fallback
  if (!trailData || !trailData.routePoints || trailData.routePoints.length === 0 || mapError) {
    return (
      <div className="trail-map-fallback">
        <img
          src={fallbackImage || 'https://via.placeholder.com/800x400.png?text=Trail+Map+Preview'}
          alt="Trail static map fallback"
          className="fallback-image"
        />
        <div className="fallback-overlay">
          <span>Interactive map unavailable. Showing static route.</span>
        </div>
      </div>
    );
  }

  const { routePoints } = trailData;
  const positions = routePoints.map(pt => [pt.lat, pt.lng]);

  const startPoint = routePoints[0];
  const endPoint = routePoints[routePoints.length - 1];

  // Calculate center using average of start and end for simplicity, 
  // or just use startPoint
  const centerLat = (startPoint.lat + endPoint.lat) / 2;
  const centerLng = (startPoint.lng + endPoint.lng) / 2;

  // Render tooltip for hover over polyline points
  const renderPointMarkersForTooltips = () => {
    // To show tooltips neatly along the route, we place invisible circle markers
    // over key points (every Nth point) or over all points if not too many
    const step = Math.max(1, Math.floor(routePoints.length / 15));

    return routePoints.filter((_, idx) => idx % step === 0).map((pt, index) => (
      <Marker
        key={`pt-${index}`}
        position={[pt.lat, pt.lng]}
        icon={new L.DivIcon({ className: 'invisible-marker', iconSize: [10, 10] })}
      >
        <Tooltip direction="top" offset={[0, -5]} opacity={0.9}>
          <div className="trail-tooltip">
            <strong>Elevation:</strong> {pt.elevation}m<br />
            <strong>Distance:</strong> {pt.distance}km
          </div>
        </Tooltip>
      </Marker>
    ));
  };

  return (
    <div className="interactive-trail-map-container">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        scrollWheelZoom={false}
        className="leaflet-map-element"
        whenReady={(mapInstance) => {
          // Fit bounds to polyline
          const bounds = L.latLngBounds(positions);
          mapInstance.target.fitBounds(bounds, { padding: [50, 50] });
        }}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
          attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
        />

        <Polyline
          positions={positions}
          pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.8 }}
        />

        {/* Start Marker */}
        <Marker position={[startPoint.lat, startPoint.lng]} icon={startIcon}>
          <Tooltip direction="top" offset={[0, -12]}><strong>Start Point</strong></Tooltip>
        </Marker>

        {/* End Marker */}
        <Marker position={[endPoint.lat, endPoint.lng]} icon={endIcon}>
          <Tooltip direction="top" offset={[0, -12]}><strong>End Point</strong></Tooltip>
        </Marker>

        {/* Interactive hover points for distance and elevation */}
        {renderPointMarkersForTooltips()}
      </MapContainer>
    </div>
  );
};

export default InteractiveTrailMap;
