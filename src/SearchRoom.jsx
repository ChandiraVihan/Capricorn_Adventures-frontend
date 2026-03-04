import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './SearchRoom.css';

const SearchRoom = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        checkIn: '',
        checkOut: '',
        guests: 1
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const checkIn = params.get('checkIn') || '';
        const checkOut = params.get('checkOut') || '';
        const guests = params.get('guests') || 1;

        setFilters({ checkIn, checkOut, guests: parseInt(guests) });
        fetchRooms(checkIn, checkOut, guests);
    }, [location.search]);

    const fetchRooms = async (checkIn, checkOut, guests) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8080/api/rooms/search?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
            if (res.ok) {
                const data = await res.json();
                setRooms(data);
            }
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const applyFilters = () => {
        const query = new URLSearchParams(filters).toString();
        navigate(`/search?${query}`);
    };

    return (
        <div className="search-page-container">
            <div className="search-filters-sidebar">
                <h3>Refine Search</h3>
                <div className="filter-group">
                    <label>Check In</label>
                    <input type="date" name="checkIn" value={filters.checkIn} onChange={handleFilterChange} />
                </div>
                <div className="filter-group">
                    <label>Check Out</label>
                    <input type="date" name="checkOut" value={filters.checkOut} onChange={handleFilterChange} />
                </div>
                <div className="filter-group">
                    <label>Guests</label>
                    <input type="number" min="1" name="guests" value={filters.guests} onChange={handleFilterChange} />
                </div>
                <button onClick={applyFilters} className="apply-btn">Update Results</button>
            </div>

            <div className="search-results-content">
                <div className="results-header">
                    <h2>Available Packages & Rooms</h2>
                    <p>{rooms.length} options found for your dates</p>
                </div>

                {loading ? (
                    <div className="loading-state">Finding best options...</div>
                ) : (
                    <div className="rooms-grid">
                        {rooms.map((room) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={room.id}
                                className="room-card"
                            >
                                <div className="room-image">
                                    <img src={room.images?.[0]?.imageUrl || "src/assets/700644344.jpg"} alt={room.name} />
                                    <div className="price-tag">${room.basePrice}<span>/night</span></div>
                                </div>
                                <div className="room-info">
                                    <h3>{room.name}</h3>
                                    <div className="room-meta">
                                        <span>Capacity: {room.maxOccupancy} Guests</span>
                                    </div>
                                    <p className="room-desc">{room.description?.substring(0, 100)}...</p>
                                    <Link to={`/rooms/${room.id}?checkIn=${filters.checkIn}&checkOut=${filters.checkOut}&guests=${filters.guests}`} className="view-details-btn">
                                        View Details
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchRoom;
