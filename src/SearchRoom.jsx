import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, Calendar, AlertCircle, Info, Wifi, Tv, Coffee, AirVent, Utensils, Waves, Accessibility, Plane, CigaretteOff, ConciergeBell, Sparkles, ParkingCircle, Wine, CheckCircle2, X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './SearchRoom.css';

const formatDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

const SearchRoom = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [bookingState, setBookingState] = useState({ status: 'idle', reference: null, error: null });
    const [hasSearched, setHasSearched] = useState(false);
    
    const { user } = useAuth();
    const navigate = useNavigate();

    // Initialize state from URL
    const [filters, setFilters] = useState({
        checkin: parseDate(searchParams.get('checkin')),
        checkout: parseDate(searchParams.get('checkout')),
        guests: parseInt(searchParams.get('guests')) || 1
    });

    const validate = useCallback((data) => {
        const errors = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

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
            const apiParams = {
                guests: params.guests,
                checkIn: params.checkin instanceof Date ? formatDate(params.checkin) : params.checkin,
                checkOut: params.checkout instanceof Date ? formatDate(params.checkout) : params.checkout
            };
            const query = new URLSearchParams(apiParams).toString();
            const res = await fetch(`http://localhost:8080/api/v1/rooms/search?${query}`);
            
            if (res.ok) {
                const data = await res.json();
                setRooms(data);
            } else {
                let errData;
                try {
                    errData = await res.json();
                } catch (parseError) {
                    throw new Error("Backend returned an error. Please contact support.");
                }
                setError({ general: errData.message || "Search failed. Please try again." });
            }
        } catch (err) {
            console.error("Search failed", err);
            setError({ general: err.message || "Connection error. Is the backend running?" });
        } finally {
            setLoading(false);
            setHasSearched(true);
        }
    }, [validate]);

    useEffect(() => {
        const checkin = searchParams.get('checkin');
        const checkout = searchParams.get('checkout');
        const guests = searchParams.get('guests');

        if (checkin && checkout) {
            fetchRooms({
                checkin: parseDate(checkin),
                checkout: parseDate(checkout),
                guests: parseInt(guests) || 1
            });
        }
    }, [searchParams, fetchRooms]);

    const handleConfirmBooking = async (room) => {
        if (!user) {
            navigate('/auth');
            return;
        }

        setBookingState({ status: 'loading', reference: null, error: null });

        try {
            const response = await fetch('http://localhost:8080/api/v1/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    roomId: room.id,
                    checkInDate: formatDate(filters.checkin),
                    checkOutDate: formatDate(filters.checkout),
                    guests: filters.guests
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Booking failed');
            }

            const data = await response.json();
            setBookingState({ status: 'success', reference: data.referenceId, error: null });
        } catch (err) {
            setBookingState({ status: 'error', reference: null, error: err.message });
        }
    };

    const renderAmenityIcon = (identifier) => {
        switch (identifier?.toLowerCase()) {
            case 'wifi': return <Wifi size={14} />;
            case 'tv': return <Tv size={14} />;
            case 'coffee': return <Coffee size={14} />;
            case 'ac': 
            case 'airvent': return <AirVent size={14} />;
            case 'breakfast':
            case 'utensils': return <Utensils size={14} />;
            case 'pool':
            case 'waves': return <Waves size={14} />;
            case 'disabled':
            case 'accessibility': return <Accessibility size={14} />;
            case 'shuttle':
            case 'plane': return <Plane size={14} />;
            case 'nonsmoking':
            case 'cigaretteoff': return <CigaretteOff size={14} />;
            case 'roomservice':
            case 'conciergebell': return <ConciergeBell size={14} />;
            case 'spa':
            case 'sparkles': return <Sparkles size={14} />;
            case 'parking':
            case 'parkingcircle': return <ParkingCircle size={14} />;
            case 'bar':
            case 'wine': return <Wine size={14} />;
            default: return null;
        }
    };

    const handleDateChange = (name, date) => {
        setFilters(prev => ({ ...prev, [name]: date }));
    };

    const handleGuestChange = (e) => {
        const value = parseInt(e.target.value) || 1;
        setFilters(prev => ({ ...prev, guests: value }));
    };

    const handleSearch = () => {
        const validationErrors = validate(filters);
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            setRooms([]);
            return;
        }

        setFormErrors({});
        const newParams = new URLSearchParams(searchParams);
        if (filters.checkin) newParams.set('checkin', formatDate(filters.checkin));
        if (filters.checkout) newParams.set('checkout', formatDate(filters.checkout));
        newParams.set('guests', filters.guests.toString());
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
                    <DatePicker
                        selected={filters.checkin}
                        onChange={(date) => handleDateChange('checkin', date)}
                        selectsStart
                        startDate={filters.checkin}
                        endDate={filters.checkout}
                        minDate={new Date()}
                        placeholderText="Select date"
                        className={formErrors.checkin ? 'error' : ''}
                        dateFormat="MMM d, yyyy"
                    />
                    {formErrors.checkin && <span className="error-text">{formErrors.checkin}</span>}
                </div>

                <div className="filter-group">
                    <label><Calendar className="small-icon" /> Check Out</label>
                    <DatePicker
                        selected={filters.checkout}
                        onChange={(date) => handleDateChange('checkout', date)}
                        selectsEnd
                        startDate={filters.checkin}
                        endDate={filters.checkout}
                        minDate={filters.checkin || new Date()}
                        placeholderText="Select date"
                        className={formErrors.checkout ? 'error' : ''}
                        dateFormat="MMM d, yyyy"
                    />
                    {formErrors.checkout && <span className="error-text">{formErrors.checkout}</span>}
                </div>

                <div className="filter-group">
                    <label><Users className="small-icon" /> Guests</label>
                    <input 
                        type="number" 
                        name="guests" 
                        value={filters.guests} 
                        onChange={handleGuestChange}
                        min="1"
                        max="10"
                        className={formErrors.guests ? 'error' : ''}
                    />
                    {formErrors.guests && <span className="error-text">{formErrors.guests}</span>}
                </div>

                <button className="search-trigger-btn" onClick={handleSearch} disabled={loading}>
                    {loading ? 'Searching...' : (
                        <>
                            <Search size={18} />
                            Search Availability
                        </>
                    )}
                </button>

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
                                    key={room.id || index}
                                    className="room-card"
                                >
                                    <div className="room-image">
                                        <img 
                                            src={room.images && room.images.length > 0 ? room.images[0].imageUrl : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800'} 
                                            alt={room.name} 
                                        />
                                        <div className="price-tag">LKR {room.basePrice}<span>/night</span></div>
                                    </div>
                                    <div className="room-info">
                                        <div className="room-type-badge">Luxury Concept</div>
                                        <h3>{room.name}</h3>
                                        <p className="room-desc">{room.description}</p>
                                        
                                        {room.amenities && room.amenities.length > 0 && (
                                            <div className="room-amenities-mini">
                                                {room.amenities.slice(0, 4).map((amenity) => (
                                                    <div key={amenity.id} className="amenity-pill" title={amenity.name}>
                                                        {renderAmenityIcon(amenity.iconIdentifier)}
                                                    </div>
                                                ))}
                                                {room.amenities.length > 4 && <span className="more-amenities">+{room.amenities.length - 4}</span>}
                                            </div>
                                        )}

                                        <div className="card-footer">
                                            <button 
                                                className="view-details-btn" 
                                                onClick={() => handleConfirmBooking(room)}
                                                disabled={bookingState.status === 'loading'}
                                            >
                                                {bookingState.status === 'loading' ? 'Processing...' : 'Confirm Booking'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : !loading && hasSearched && rooms.length === 0 ? (
                        <motion.div 
                            key="empty"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="empty-results"
                        >
                            <Info size={48} />
                            <h3>No Availability</h3>
                            <p>We couldn't find any rooms for these dates and guests. Try adjusting your search.</p>
                        </motion.div>
                    ) : !loading && !hasSearched ? (
                         <motion.div 
                            key="initial"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="initial-prompt-state"
                        >
                            <div className="prompt-icon-wrapper">
                                <Search size={48} />
                            </div>
                            <h3>Find Your Paradise</h3>
                            <p>Select your preferred dates and guest count to see available luxury escapes.</p>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </main>

            {/* Booking Status Pop-up */}
            <AnimatePresence>
                {bookingState.status === 'success' && (
                    <motion.div 
                        className="booking-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className="booking-modal"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                        >
                            <button className="close-modal" onClick={() => setBookingState({ status: 'idle', reference: null, error: null })}>
                                <X size={20} />
                            </button>
                            <div className="modal-content">
                                <CheckCircle2 size={64} className="success-icon" />
                                <h2>Booking Confirmed!</h2>
                                <div className="ref-box">
                                    <span>Reference Number</span>
                                    <strong>{bookingState.reference}</strong>
                                </div>
                                <p>We've sent a confirmation email to <strong>{user?.email}</strong>. Please check your inbox for details.</p>
                                <button className="modal-primary-btn" onClick={() => setBookingState({ status: 'idle', reference: null, error: null })}>
                                    Great, thanks!
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SearchRoom;
