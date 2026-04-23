import React, { useEffect, useState, useCallback } from 'react';
import './NearbyPois.css';
import { nearbyPoiService } from './api/nearbyPoiService';

// ── constants ──────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: null,              label: 'All',            icon: '🗺️' },
  { key: 'RESTAURANT',     label: 'Restaurants',    icon: '🍽️' },
  { key: 'VIEWPOINT',      label: 'Viewpoints',     icon: '🏔️' },
  { key: 'PARKING',        label: 'Parking',        icon: '🅿️' },
  { key: 'PETROL_STATION', label: 'Petrol Stations',icon: '⛽' },
];

// ── mock fallback (shown when backend is unavailable) ─────────────────────────
const MOCK_POIS = [
  { placeId: 'p1', name: 'Trailside Café', category: 'RESTAURANT',     categoryIcon: '🍽️', distanceKm: 0.4, latitude: 6.929, longitude: 79.862, googleMapsUrl: '#' },
  { placeId: 'p2', name: 'Summit Lookout', category: 'VIEWPOINT',      categoryIcon: '🏔️', distanceKm: 1.1, latitude: 6.932, longitude: 79.858, googleMapsUrl: '#' },
  { placeId: 'p3', name: 'East Car Park',  category: 'PARKING',        categoryIcon: '🅿️', distanceKm: 0.2, latitude: 6.927, longitude: 79.861, googleMapsUrl: '#' },
  { placeId: 'p4', name: 'Lanka Fuel',     category: 'PETROL_STATION', categoryIcon: '⛽', distanceKm: 2.3, latitude: 6.940, longitude: 79.870, googleMapsUrl: '#' },
  { placeId: 'p5', name: 'Hillside Diner', category: 'RESTAURANT',     categoryIcon: '🍽️', distanceKm: 1.8, latitude: 6.935, longitude: 79.865, googleMapsUrl: '#' },
  { placeId: 'p6', name: 'Valley Vista',   category: 'VIEWPOINT',      categoryIcon: '🏔️', distanceKm: 3.0, latitude: 6.945, longitude: 79.875, googleMapsUrl: '#' },
  { placeId: 'p7', name: 'North Lot',      category: 'PARKING',        categoryIcon: '🅿️', distanceKm: 0.7, latitude: 6.928, longitude: 79.856, googleMapsUrl: '#' },
  { placeId: 'p8', name: 'Quick Stop',     category: 'PETROL_STATION', categoryIcon: '⛽', distanceKm: 4.1, latitude: 6.950, longitude: 79.880, googleMapsUrl: '#' },
];

// ── component ──────────────────────────────────────────────────────────────────
const NearbyPois = ({ adventureId }) => {
  const [allPois,        setAllPois]        = useState([]);
  const [activeCategory, setActiveCategory] = useState(null); // null = all
  const [selectedPoi,    setSelectedPoi]    = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [radiusExpanded, setRadiusExpanded] = useState(false);
  const [searchRadiusKm, setSearchRadiusKm] = useState(5);
  const [isMock,         setIsMock]         = useState(false);

  // ── fetch ────────────────────────────────────────────────────────────────────
  const fetchPois = useCallback(async () => {
    setLoading(true);
    setSelectedPoi(null);
    try {
      const data = await nearbyPoiService.getNearbyPois(adventureId, null);
      setAllPois(data?.pois ?? []);
      setRadiusExpanded(data?.radiusExpanded ?? false);
      setSearchRadiusKm(data?.searchRadiusKm ?? 5);
      setIsMock(false);
    } catch {
      // Backend unavailable – use mock data so the UI is still demonstrable
      setAllPois(MOCK_POIS);
      setRadiusExpanded(false);
      setSearchRadiusKm(5);
      setIsMock(true);
    } finally {
      setLoading(false);
    }
  }, [adventureId]);

  useEffect(() => { fetchPois(); }, [fetchPois]);

  // ── derived list (client-side filter mirrors the server filter) ───────────────
  const visiblePois = activeCategory
    ? allPois.filter(p => p.category === activeCategory)
    : allPois;

  // ── handlers ─────────────────────────────────────────────────────────────────
  const handleCategoryClick = (key) => {
    setActiveCategory(key);
    setSelectedPoi(null);
  };

  const handlePoiClick = (poi) => {
    setSelectedPoi(prev => prev?.placeId === poi.placeId ? null : poi);
  };

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <section className="npoi-section">
      <div className="npoi-header">
        <div className="npoi-title-row">
          <span className="npoi-compass">🧭</span>
          <div>
            <h2 className="npoi-heading">Nearby Points of Interest</h2>
            <p className="npoi-sub">
              Within {searchRadiusKm} km of adventure start
              {radiusExpanded && <span className="npoi-radius-badge"> · radius expanded</span>}
              {isMock && <span className="npoi-mock-badge"> · preview data</span>}
            </p>
          </div>
        </div>

        {/* Category filter pills */}
        <div className="npoi-filters" role="tablist" aria-label="Filter by POI category">
          {CATEGORIES.map(({ key, label, icon }) => (
            <button
              key={String(key)}
              role="tab"
              aria-selected={activeCategory === key}
              className={`npoi-filter-pill ${activeCategory === key ? 'active' : ''}`}
              onClick={() => handleCategoryClick(key)}
            >
              <span className="npoi-filter-icon">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="npoi-loading">
          <div className="npoi-spinner" />
          <span>Locating nearby spots…</span>
        </div>
      ) : visiblePois.length === 0 ? (
        <div className="npoi-empty">
          <span className="npoi-empty-icon">📍</span>
          <p>No {activeCategory ? CATEGORIES.find(c => c.key === activeCategory)?.label.toLowerCase() : 'points of interest'} found nearby.</p>
        </div>
      ) : (
        <div className="npoi-grid">
          {visiblePois.map((poi, idx) => (
            <div key={poi.placeId} className="npoi-card-wrapper">
              <button
                className={`npoi-card ${selectedPoi?.placeId === poi.placeId ? 'npoi-card--selected' : ''}`}
                onClick={() => handlePoiClick(poi)}
                style={{ animationDelay: `${idx * 55}ms` }}
                aria-pressed={selectedPoi?.placeId === poi.placeId}
              >
                {/* Map pin marker */}
                <span className="npoi-pin" aria-hidden="true">📍</span>

                <div className="npoi-card-body">
                  <div className="npoi-card-top">
                    <span className="npoi-cat-icon" title={poi.category}>{poi.categoryIcon}</span>
                    <span className="npoi-cat-label">{poi.category.replace('_', ' ')}</span>
                  </div>
                  <p className="npoi-name">{poi.name}</p>
                  <p className="npoi-distance">
                    <span className="npoi-distance-dot" />
                    {poi.distanceKm.toFixed(1)} km away
                  </p>
                </div>
              </button>

              {/* Expandable mini-card */}
              {selectedPoi?.placeId === poi.placeId && (
                <div className="npoi-mini-card" role="dialog" aria-label={`Details for ${poi.name}`}>
                  <div className="npoi-mini-header">
                    <span className="npoi-mini-icon">{poi.categoryIcon}</span>
                    <div>
                      <p className="npoi-mini-name">{poi.name}</p>
                      <p className="npoi-mini-cat">{poi.category.replace('_', ' ')}</p>
                    </div>
                    <button className="npoi-mini-close" onClick={() => setSelectedPoi(null)} aria-label="Close">✕</button>
                  </div>
                  <div className="npoi-mini-body">
                    <div className="npoi-mini-stat">
                      <span>📏</span>
                      <span>{poi.distanceKm.toFixed(2)} km from start</span>
                    </div>
                    <div className="npoi-mini-stat">
                      <span>🌐</span>
                      <span>{poi.latitude.toFixed(5)}, {poi.longitude.toFixed(5)}</span>
                    </div>
                  </div>
                  <a
                    href={poi.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="npoi-directions-btn"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
                    Get Directions
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default NearbyPois;
