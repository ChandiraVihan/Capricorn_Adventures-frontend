import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Adventures.css';
import defaultAdventureImage from './assets/photo-1550025005-05b9002486c5.avif';
import { adventureService } from './api/adventureService';

const EMPTY_CATEGORY_LABEL = 'All';

const normalizeAdventure = (item) => ({
  id: item?.id || item?.adventureId || item?._id,
  title: item?.title || item?.name || 'Untitled Adventure',
  description: item?.description || item?.summary || 'No description available.',
  location: item?.location || item?.destination || 'Location TBA',
  category: item?.category || item?.type || 'General',
  durationHours: item?.durationHours || item?.duration || 0,
  price: item?.price || item?.basePrice || 0,
  difficulty: item?.difficulty || item?.difficultyLevel || 'Moderate',
  minAge: item?.minAge || item?.ageRestriction?.min || 0,
  maxAge: item?.maxAge || item?.ageRestriction?.max || null,
  isActive: item?.isActive !== false && item?.status !== 'INACTIVE',
  image: item?.coverImage || item?.thumbnail || item?.images?.[0]?.imageUrl || defaultAdventureImage,
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
    image: defaultAdventureImage,
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
    image: defaultAdventureImage,
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
    image: defaultAdventureImage,
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
  });

  useEffect(() => {
    fetchCategories();

    const params = new URLSearchParams(location.search);
    const nextFilters = {
      category: params.get('category') || EMPTY_CATEGORY_LABEL,
      categoryId: params.get('categoryId') || '',
      minPrice: params.get('minPrice') || '',
      maxPrice: params.get('maxPrice') || '',
      maxDurationHours: params.get('maxDurationHours') || '',
    };

    setFilters(nextFilters);
    fetchAdventures(nextFilters);
  }, [location.search]);

  const fetchCategories = async () => {
    try {
      const data = await adventureService.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setCategories([]);
    }
  };

  const fetchAdventures = async (currentFilters) => {
    setLoading(true);
    setError('');

    try {
      const rows = await adventureService.browseAdventures({
        categoryId: currentFilters.categoryId || undefined,
        category: currentFilters.category !== EMPTY_CATEGORY_LABEL ? currentFilters.category : undefined,
        minPrice: currentFilters.minPrice || undefined,
        maxPrice: currentFilters.maxPrice || undefined,
        maxDurationHours: currentFilters.maxDurationHours || undefined,
      });
      setAdventures(rows.map(normalizeAdventure));
    } catch (err) {
      setError('Showing sample adventures because live data is currently unavailable.');
      const sample = fallbackAdventures.filter((item) => {
        const matchesCategory = currentFilters.category === EMPTY_CATEGORY_LABEL || item.category === currentFilters.category;
        const matchesMin = currentFilters.minPrice ? item.price >= Number(currentFilters.minPrice) : true;
        const matchesMax = currentFilters.maxPrice ? item.price <= Number(currentFilters.maxPrice) : true;
        const matchesDuration = currentFilters.maxDurationHours ? item.durationHours <= Number(currentFilters.maxDurationHours) : true;
        return matchesCategory && matchesMin && matchesMax && matchesDuration;
      });
      setAdventures(sample);
    } finally {
      setLoading(false);
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
    return adventures.filter((item) => {
      const matchesCategory = filters.category === EMPTY_CATEGORY_LABEL || item.category === filters.category;
      const matchesMin = filters.minPrice ? item.price >= Number(filters.minPrice) : true;
      const matchesMax = filters.maxPrice ? item.price <= Number(filters.maxPrice) : true;
      const matchesDuration = filters.maxDurationHours ? item.durationHours <= Number(filters.maxDurationHours) : true;
      return matchesCategory && matchesMin && matchesMax && matchesDuration;
    });
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
          <input type="number" min="0" value={filters.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} placeholder="USD" />
        </div>

        <div className="filter-group">
          <label>Max Price</label>
          <input type="number" min="0" value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} placeholder="USD" />
        </div>

        <div className="filter-group">
          <label>Max Duration (hours)</label>
          <input type="number" min="1" value={filters.maxDurationHours} onChange={(e) => updateFilter('maxDurationHours', e.target.value)} />
        </div>

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
                      <img src={adventure.image} alt={adventure.title} />
                      <span className="difficulty-chip">{adventure.difficulty}</span>
                      <span className="price-tag">${adventure.price}<span>/person</span></span>
                    </div>
                    <div className="adventure-info">
                      <h3>{adventure.title}</h3>
                      <p className="adventure-meta">{adventure.location} · {adventure.durationHours}h · {adventure.category}</p>
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
