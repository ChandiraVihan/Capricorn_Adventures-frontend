import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Adventures.css';
import defaultAdventureImage from './assets/1144044-12fb5cf4-fbd4-421a-bd23-76d6d164b227.avif';
import whaleWatchingImage from './assets/whale-watching-sri-lanka.webp';
import safariImage from './assets/images (2).jpg';
import waterSportsImage from './assets/watersking.jpg';
import culturalToursImage from './assets/Sri-Lanka-Cultural-Tours-Polonnaruwa.jpg';
import hikingImage from './assets/um-palacio-no-topo-da.jpg';
import campingImage from './assets/1.jpg';
import colomboCityImage from './assets/colombo-sri-lanka-12fb929f68f145379077137d65531e81.jpg';
import yalaImage from './assets/700644293.jpg';
import galleFortImage from './assets/700644344.jpg';
import localCardImage1 from './assets/images (3).jpg';
import localCardImage2 from './assets/754838806.jpg';
import localCardImage3 from './assets/754839073.jpg';
import localCardImage4 from './assets/754840632.jpg';
import localCardImage5 from './assets/754841326.jpg';
import { adventureService } from './api/adventureService';

const EMPTY_CATEGORY_LABEL = 'All';

// --- Frontend Driving Distance Fallback (US21 Viva Support) ---
const cityCoordinates = {
  colombo: { lat: 6.9271, lng: 79.8612 },
  kandy: { lat: 7.2906, lng: 80.6337 },
  galle: { lat: 6.0328, lng: 80.2149 },
  matara: { lat: 5.9549, lng: 80.5469 },
  negombo: { lat: 7.2008, lng: 79.8737 },
};

function getDrivingDistanceMock(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistance = R * c;
  // Multiply by 1.4 road winding factor to approximate driving distance
  return Math.round(straightDistance * 1.4);
}

function getTravelTimeMock(distanceKm) {
  if (!distanceKm) return null;
  const speedKmH = 50; // Average driving speed
  const totalHours = distanceKm / speedKmH;
  const hrs = Math.floor(totalHours);
  const mins = Math.round((totalHours - hrs) * 60);
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

const lkrFormatter = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 0,
});

const formatLkr = (value) => lkrFormatter.format(Number(value || 0));

const catalogImagePool = [
  whaleWatchingImage,
  safariImage,
  waterSportsImage,
  culturalToursImage,
  hikingImage,
  campingImage,
  localCardImage1,
  localCardImage2,
  localCardImage3,
  localCardImage4,
  localCardImage5,
];

const hashString = (value) => {
  const input = String(value || 'default');
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const categoryImageMap = {
  'WHALE WATCHING': whaleWatchingImage,
  SAFARIS: safariImage,
  'WATER SPORTS': waterSportsImage,
  'CULTURAL TOURS': culturalToursImage,
  HIKING: hikingImage,
  CAMPING: campingImage,
};

// Adventure-title specific overrides. Keep keys uppercase for easier matching.
const adventureImageMap = {
  'SUNRISE WHALE WATCHING CRUISE': whaleWatchingImage,
  'YALA HALF-DAY SAFARI': yalaImage,
  'GALLE FORT CULTURAL WALK': galleFortImage,
  'COLOMBO CITY TOUR': colomboCityImage,
};

const normalizeKey = (value) => String(value || '').trim().toUpperCase();

const pickRandomCatalogImage = (item) => {
  const seed = `${item?.id || item?.adventureId || item?._id || ''}-${item?.title || item?.name || ''}`;
  const index = hashString(seed) % catalogImagePool.length;
  return catalogImagePool[index] || defaultAdventureImage;
};

const pickFallbackImage = (item) => {
  const titleKey = normalizeKey(item?.title || item?.name);
  if (titleKey && adventureImageMap[titleKey]) {
    return adventureImageMap[titleKey];
  }

  const categoryLabel = String(item?.category || item?.categoryName || item?.type || '').toUpperCase();
  if (categoryImageMap[categoryLabel]) {
    return categoryImageMap[categoryLabel];
  }

  const matchedKey = Object.keys(categoryImageMap).find((key) => categoryLabel.includes(key));
  return matchedKey ? categoryImageMap[matchedKey] : defaultAdventureImage;
};

const normalizeAdventure = (item) => ({
  id: item?.id || item?.adventureId || item?._id,
  title: item?.title || item?.name || 'Untitled Adventure',
  description: item?.description || item?.summary || 'No description available.',
  location: item?.location || item?.destination || 'Location TBA',
  category: item?.category || item?.categoryName || item?.type || 'General',
  durationHours: item?.durationHours || item?.duration || 0,
  price: item?.price || item?.basePrice || 0,
  difficulty: item?.difficulty || item?.difficultyLevel || 'Moderate',
  minAge: item?.minAge || item?.ageRestriction?.min || 0,
  maxAge: item?.maxAge || item?.ageRestriction?.max || null,
  isActive: item?.isActive !== false && item?.status !== 'INACTIVE',
  image: adventureImageMap[normalizeKey(item?.title || item?.name)] || pickFallbackImage(item) || pickRandomCatalogImage(item),
  distance: item?.distanceKm || item?.distance || null,
  travelTime: item?.estimatedTravelTime || item?.travelTime || null,
});

const fallbackAdventures = [
  {
    id: 'sample-whale-01',
    title: 'Sunrise Whale Watching Cruise',
    description: 'Spot blue whales and dolphins with marine naturalists and breakfast onboard.',
    location: 'Mirissa Harbor',
    category: 'Whale Watching',
    durationHours: 4,
    price: 75,
    difficulty: 'Easy',
    minAge: 8,
    maxAge: null,
    isActive: true,
    image: categoryImageMap['WHALE WATCHING'],
    lat: 5.9483,
    lng: 80.4716, // Mirissa
  },
  {
    id: 'sample-safari-02',
    title: 'Yala Half-Day Safari',
    description: 'Track leopards, elephants, and birdlife with an experienced tracker guide.',
    location: 'Yala National Park',
    category: 'Safaris',
    durationHours: 6,
    price: 120,
    difficulty: 'Moderate',
    minAge: 10,
    maxAge: null,
    isActive: true,
    image: categoryImageMap.SAFARIS,
    lat: 6.3683,
    lng: 81.5161, // Yala
  },
  {
    id: 'sample-culture-03',
    title: 'Galle Fort Cultural Walk',
    description: 'Explore colonial lanes, artisan shops, and local history with a storyteller guide.',
    location: 'Galle',
    category: 'Cultural Tours',
    durationHours: 2,
    price: 35,
    difficulty: 'Easy',
    minAge: 6,
    maxAge: null,
    isActive: true,
    image: categoryImageMap['CULTURAL TOURS'],
    lat: 6.0328,
    lng: 80.2149, // Galle
  },
];

const Adventures = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [adventures, setAdventures] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: EMPTY_CATEGORY_LABEL,
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    maxDurationHours: '',
    sortBy: '',
  });

  const [locationStatus, setLocationStatus] = useState('pending'); // 'pending', 'granted', 'denied'
  const [userLocation, setUserLocation] = useState({ lat: null, lng: null });
  const [userCity, setUserCity] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [distanceLoading, setDistanceLoading] = useState(false);

  // 1. Handle initial session state and location request
  useEffect(() => {
    fetchCategories();

    const storedCity = sessionStorage.getItem('userCity');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          setUserLocation({ lat: latitude, lng: longitude });
          setUserCity('');
          setCityInput('');

          sessionStorage.setItem('userLat', latitude);
          sessionStorage.setItem('userLng', longitude);
          sessionStorage.removeItem('userCity');

          setLocationStatus('granted');
        },
        () => {
          if (storedCity) {
            setUserCity(storedCity);
            setCityInput(storedCity);
          }
          setLocationStatus('denied');
        },
        { timeout: 5000 }
      );
    } else {
      if (storedCity) {
        setUserCity(storedCity);
        setCityInput(storedCity);
      }
      setLocationStatus('denied');
    }
  }, []);

  // 2. Load params from URL and apply filters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const nextFilters = {
      category: params.get('category') || EMPTY_CATEGORY_LABEL,
      categoryId: params.get('categoryId') || '',
      minPrice: params.get('minPrice') || '',
      maxPrice: params.get('maxPrice') || '',
      maxDurationHours: params.get('maxDurationHours') || '',
      sortBy: params.get('sortBy') || '',
    };

    setFilters(nextFilters);
    fetchAdventures(nextFilters, userLocation, userCity);
  }, [location.search, userLocation, userCity]);

  // 3. Handle explicit city manual submit (AC3)
  const handleCitySubmit = (e) => {
    e.preventDefault();

    const city = cityInput.trim();
    if (!city) return;

    sessionStorage.setItem('userCity', city);
    sessionStorage.removeItem('userLat');
    sessionStorage.removeItem('userLng');

    setUserLocation({ lat: null, lng: null });
    setUserCity(city);
    setDistanceLoading(true);
    setAdventures((prev) =>
        prev.map((adv) => ({
          ...adv,
          distance: null,
          travelTime: null,
        }))
      );
  };

  const fetchCategories = async () => {
    try {
      const data = await adventureService.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    }
  };

  const fetchAdventures = async (currentFilters, loc = userLocation, city = userCity) => {
    setLoading(true);
    setError('');
    const requestStartedAt = Date.now();

    try {
      const apiFilters = {
        categoryId: currentFilters.categoryId || undefined,
        category: currentFilters.category !== EMPTY_CATEGORY_LABEL ? currentFilters.category : undefined,
        minPrice: currentFilters.minPrice || undefined,
        maxPrice: currentFilters.maxPrice || undefined,
        maxDurationHours: (currentFilters.maxDurationHours && currentFilters.maxDurationHours !== '') ? currentFilters.maxDurationHours : undefined,
        sortBy: currentFilters.sortBy || undefined,
      };

      if (loc.lat && loc.lng) {
        apiFilters.userLat = loc.lat;
        apiFilters.userLng = loc.lng;
      } else if (city) {
        apiFilters.userCity = city;
        apiFilters.city = city;
      }

      const controller = new AbortController();

      const response = await adventureService.browseAdventures(apiFilters, controller.signal);

      const rows = Array.isArray(response) ? response : (response?.adventures || []);

      let uLat = loc?.lat;
      let uLng = loc?.lng;
      if (!uLat && city) {
        const matchedCity = cityCoordinates[city.toLowerCase().trim()];
        if (matchedCity) { uLat = matchedCity.lat; uLng = matchedCity.lng; }
      }

      setAdventures(rows.map(item => {
        const norm = normalizeAdventure(item);
        if (!norm.distance && uLat && uLng && item.lat && item.lng) {
          norm.distance = getDrivingDistanceMock(uLat, uLng, item.lat, item.lng);
          norm.travelTime = getTravelTimeMock(norm.distance);
        }
        return norm;
      }));
    } catch (err) {
      if (err.name === 'AbortError') {
        // Enforce constraint but fail gracefully: degrade the distance display silently
        // Avoid throwing global error strings. Instead, clear conflicting distance data.
        setAdventures((prev) => prev.map((adv) => ({ ...adv, distance: null, travelTime: null })));
      } else {
        console.error('Failed to fetch adventures', err);
        setError('Showing sample adventures because live data is currently unavailable.');

        let uLat = loc?.lat;
        let uLng = loc?.lng;
        if (!uLat && city) {
          const matchedCity = cityCoordinates[city.toLowerCase().trim()];
          if (matchedCity) { uLat = matchedCity.lat; uLng = matchedCity.lng; }
        }

        const sample = fallbackAdventures.filter((item) => {
          const matchesCategory = currentFilters.category === EMPTY_CATEGORY_LABEL || item.category === currentFilters.category;
          const matchesMin = currentFilters.minPrice ? item.price >= Number(currentFilters.minPrice) : true;
          const matchesMax = currentFilters.maxPrice ? item.price <= Number(currentFilters.maxPrice) : true;
          const matchesDuration = currentFilters.maxDurationHours ? item.durationHours <= Number(currentFilters.maxDurationHours) : true;
          return matchesCategory && matchesMin && matchesMax && matchesDuration;
        }).map(item => {
          let dist = null;
          let time = null;
          if (uLat && uLng && item.lat && item.lng) {
            dist = getDrivingDistanceMock(uLat, uLng, item.lat, item.lng);
            time = getTravelTimeMock(dist);
          }
          return { ...item, distance: dist, travelTime: time };
        });
        setAdventures(sample);
      }
    } finally {
      const elapsed = Date.now() - requestStartedAt;
      const remaining = Math.max(0, 1000 - elapsed);

      setTimeout(() => {
        setLoading(false);
        setDistanceLoading(false);
      }, remaining);
    }
  };

  const categoryPills = useMemo(() => {
    const categoryMap = adventures.reduce((acc, item) => {
      if (!item.isActive) return acc;
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    categories.forEach((cat) => {
      const label = cat?.name || cat?.category || cat?.title;
      if (label && !categoryMap[label]) {
        categoryMap[label] = 0;
      }
    });

    const allCount = adventures.filter((item) => item.isActive).length;
    return [{ name: EMPTY_CATEGORY_LABEL, count: allCount }, ...Object.entries(categoryMap).map(([name, count]) => ({ name, count }))];
  }, [adventures, categories]);

  const visibleAdventures = useMemo(() => {
    const filtered = adventures.filter((item) => {
      const matchesCategory = filters.category === EMPTY_CATEGORY_LABEL || item.category === filters.category;
      const matchesMin = filters.minPrice ? item.price >= Number(filters.minPrice) : true;
      const matchesMax = filters.maxPrice ? item.price <= Number(filters.maxPrice) : true;
      const matchesDuration = filters.maxDurationHours ? item.durationHours <= Number(filters.maxDurationHours) : true;
      return matchesCategory && matchesMin && matchesMax && matchesDuration;
    });

    if (filters.sortBy === 'distance') {
      return [...filtered].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }

    return filtered;
  }, [adventures, filters]);

  const updateFilter = (name, value) => {
    if (name === 'category') {
      const selectedCategory = categories.find((cat) => (cat?.name || cat?.category || cat?.title) === value);
      setFilters((prev) => ({
        ...prev,
        category: value,
        categoryId: value === EMPTY_CATEGORY_LABEL ? '' : String(selectedCategory?.id || selectedCategory?.categoryId || ''),
      }));
      return;
    }

    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== EMPTY_CATEGORY_LABEL) params.set('category', filters.category);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.maxDurationHours) params.set('maxDurationHours', filters.maxDurationHours);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    navigate(`/adventures?${params.toString()}`);
  };

  const clearFilters = () => {
    navigate('/adventures');
  };

  const selectedCategoryIsEmpty = filters.category !== EMPTY_CATEGORY_LABEL && visibleAdventures.length === 0;

  return (
    <div className="adventures-page-container">
      <aside className="adventures-filters-sidebar">
        <h3>Browse Adventures</h3>

        <div className="category-list">
          {categoryPills.map((category) => (
            <button
              key={category.name}
              type="button"
              className={`category-pill ${filters.category === category.name ? 'active' : ''}`}
              onClick={() => updateFilter('category', category.name)}
            >
              <span>{category.name}</span>
              <strong>{category.count}</strong>
            </button>
          ))}
        </div>

        <div className="filter-group">
          <label>Min Price</label>
          <input type="number" min="0" value={filters.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} placeholder="LKR" />
        </div>

        <div className="filter-group">
          <label>Max Price</label>
          <input type="number" min="0" value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} placeholder="LKR" />
        </div>

        <div className="filter-group">
          <label>Sort By</label>
          <select value={filters.sortBy} onChange={(e) => updateFilter('sortBy', e.target.value)}>
            <option value="">Default Relevance</option>
            <option value="distance">Distance (Nearest First)</option>
          </select>
        </div>

        {locationStatus === 'denied' && (
          <div className="filter-group location-fallback">
            <label>Your Location (City)</label>
            <form onSubmit={handleCitySubmit} className="city-input-form">
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="Enter your city..."
              />
              <button type="submit" className="city-submit-btn">Go</button>
            </form>
            <small>Submit to recalculate times.</small>
          </div>
        )}

        {locationStatus === 'granted' && (
          <div className="filter-group location-granted">
            <p className="location-info">📍 Using your precise location for accurate travel times.</p>
          </div>
        )}

        <button type="button" className="apply-btn" onClick={applyFilters}>Apply Filters</button>
        <button type="button" className="clear-btn" onClick={clearFilters}>Reset</button>
      </aside>

      <section className="adventures-results-content">
        <div className="results-header">
          <h2>Adventure Collection</h2>
          <p>{visibleAdventures.length} adventure options available</p>
          {error && <p className="data-warning">{error}</p>}
        </div>

        {loading ? (
          <div className="loading-state">Loading adventures...</div>
        ) : (
          <>
            {selectedCategoryIsEmpty ? (
              <div className="empty-category-box">
                <h3>No adventures available</h3>
                <p>Try another category or widen your price and duration filters.</p>
                <div className="empty-suggestions">
                  <button type="button" onClick={() => updateFilter('category', EMPTY_CATEGORY_LABEL)}>See all categories</button>
                  <button type="button" onClick={clearFilters}>Clear all filters</button>
                </div>
              </div>
            ) : (
              <div className="adventures-grid">
                {visibleAdventures.map((adventure) => (
                  <article key={adventure.id} className="adventure-card">
                    <div className="adventure-image">
                      <img
                        src={adventure.image}
                        alt={adventure.title}
                        onError={(event) => {
                          event.currentTarget.src = defaultAdventureImage;
                        }}
                      />
                      <span className="difficulty-chip">{adventure.difficulty}</span>
                      <span className="price-tag">{formatLkr(adventure.price)}<span>/person</span></span>
                    </div>
                    <div className="adventure-info">
                      <h3>{adventure.title}</h3>
                      <p className="adventure-meta">{adventure.location} · {adventure.durationHours}h · {adventure.category}</p>

                      {distanceLoading ? (
                        <p className="adventure-distance-meta" style={{ color: '#888', fontWeight: 400 }}>
                          Calculating distances...
                        </p>
                      ) : (adventure.distance || adventure.travelTime) && (
                        <p className="adventure-distance-meta">
                          {adventure.distance ? `${adventure.distance} km ` : ''}
                          {adventure.distance && adventure.travelTime ? '· ' : ''}
                          {adventure.travelTime ? `🚗 ${adventure.travelTime}` : ''}
                        </p>
                      )}

                      <p className="adventure-desc">{adventure.description.substring(0, 120)}...</p>
                      <Link to={`/adventures/${adventure.id}`} className="view-details-btn">View Adventure</Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Adventures;
