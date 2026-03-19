import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, Calendar, AlertCircle, Info } from 'lucide-react';
import './SearchRoom.css';

const SearchRoom = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    // Initialize state from URL
    const [filters, setFilters] = useState({
        checkin: searchParams.get('checkin') || '',
        checkout: searchParams.get('checkout') || '',
        guests: parseInt(searchParams.get('guests')) || 1
    });

    const validate = useCallback((data) => {
        const errors = {};
        const today = new Date().toISOString().split('T')[0];

        if (!data.checkin) {
            errors.checkin = "Check-in date is required";
        } else if (data.checkin < today) {
            errors.checkin = "Check-in must be today or future";
        }

        if (!data.checkout) {
            errors.checkout = "Check-out date is required";
        } else if (data.checkin && data.checkout <= data.checkin) {
            errors.checkout = "Check-out must be after check-in";
        }

        if (!data.guests || data.guests < 1) {
            errors.guests = "At least 1 guest required";
        } else if (data.guests > 10) {
            errors.guests = "Max 10 guests allowed";
        }

        return errors;
    }, []);

    const fetchRooms = useCallback(async (params) => {
        const validationErrors = validate(params);
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            setRooms([]);
            return;
        }

        setFormErrors({});
        setLoading(true);
        setError(null);

        try {
            const query = new URLSearchParams(params).toString();
            const res = await fetch(`http://localhost:8080/api/v1/rooms/search?${query}`);
            
            if (res.ok) {
                const data = await res.json();
                setRooms(data);
            } else {
                const errData = await res.json();
                setError(errData.messages || { general: "Search failed. Please try again." });
            }
        } catch (err) {
            console.error("Search failed", err);
            setError({ general: "Connection error. Is the backend running?" });
        } finally {
            setLoading(false);
        }
    }, [validate]);

    // Update URL and trigger search when filters change
    useEffect(() => {
        const params = {
            checkin: searchParams.get('checkin') || '',
            checkout: searchParams.get('checkout') || '',
            guests: searchParams.get('guests') || '1'
        };

        // Only search if we have the minimum required params in URL
        if (params.checkin && params.checkout) {
            fetchRooms(params);
        }
    }, [searchParams, fetchRooms]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);

        // Immediate URL update
        const newParams = new URLSearchParams(searchParams);
        newParams.set(name, value);
        setSearchParams(newParams);
    };

    return (
        <div className="search-page-container">
            <aside className="search-filters-sidebar">
                <div className="sidebar-header">
                    <Search className="icon" />
                    <h3>Find Your Stay</h3>
                </div>

                <div className="filter-group">
                    <label><Calendar className="small-icon" /> Check In</label>
                    <input 
                        type="date" 
                        name="checkin" 
                        value={filters.checkin} 
                        onChange={handleFilterChange}
                        className={formErrors.checkin ? 'error' : ''}
                    />
                    {formErrors.checkin && <span className="error-text">{formErrors.checkin}</span>}
                </div>

                <div className="filter-group">
                    <label><Calendar className="small-icon" /> Check Out</label>
                    <input 
                        type="date" 
                        name="checkout" 
                        value={filters.checkout} 
                        onChange={handleFilterChange}
                        className={formErrors.checkout ? 'error' : ''}
                    />
                    {formErrors.checkout && <span className="error-text">{formErrors.checkout}</span>}
                </div>

                <div className="filter-group">
                    <label><Users className="small-icon" /> Guests</label>
                    <input 
                        type="number" 
                        name="guests" 
                        value={filters.guests} 
                        onChange={handleFilterChange}
                        min="1"
                        max="10"
                        className={formErrors.guests ? 'error' : ''}
                    />
                    {formErrors.guests && <span className="error-text">{formErrors.guests}</span>}
                </div>

                {error?.general && (
                    <div className="general-error">
                        <AlertCircle className="small-icon" />
                        {error.general}
                    </div>
                )}
            </aside>

            <main className="search-results-content">
                <header className="results-header">
                    <h2>Available Experiences</h2>
                    <p>{loading ? 'Searching...' : rooms.length === 0 ? 'No rooms match your criteria' : `${rooms.length} exclusive options found`}</p>
                </header>

                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="loading-state"
                        >
                            <div className="loader"></div>
                            <p>Curating the perfect stays for you...</p>
                        </motion.div>
                    ) : rooms.length > 0 ? (
                        <motion.div 
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="rooms-grid"
                        >
                            {rooms.map((room, index) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    key={index}
                                    className="room-card"
                                >
                                    <div className="room-image">
                                        <img src={`https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800`} alt={room.roomType} />
                                        <div className="price-tag">${room.pricePerNight}<span>/night</span></div>
                                    </div>
                                    <div className="room-info">
                                        <div className="room-type-badge">Luxury Concept</div>
                                        <h3>{room.roomType}</h3>
                                        <p className="room-desc">{room.details}</p>
                                        <div className="card-footer">
                                            <Link to="#" className="view-details-btn">
                                                Explore Suite
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : !loading && rooms.length === 0 && filters.checkin && filters.checkout ? (
                        <motion.div 
                            key="empty"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="no-availability-container"
                        >
                            <div className="empty-icon-wrapper">
                                <Info className="empty-icon" />
                            </div>
                            <h3>No Availability Found</h3>
                            <p>We couldn't find any rooms matching your exact combination of guests and dates.</p>
                            
                            <div className="suggestions-box">
                                <h4>Actionable Suggestions:</h4>
                                <ul>
                                    <li>Try adjusting your dates by a few days</li>
                                    <li>Reducing the number of guests may reveal more options</li>
                                    <li>If you have exactly 5 guests, try searching for two separate rooms</li>
                                </ul>
                            </div>
                            
                            <button 
                                onClick={() => {
                                    setFilters({ ...filters, guests: 2 });
                                    const newParams = new URLSearchParams(searchParams);
                                    newParams.set('guests', '2');
                                    setSearchParams(newParams);
                                }}
                                className="reset-suggestion-btn"
                            >
                                Try 2 Guests
                            </button>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default SearchRoom;

