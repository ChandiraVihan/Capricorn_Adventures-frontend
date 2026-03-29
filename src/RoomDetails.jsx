import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import './RoomDetails.css';
import { API_BASE_URL } from './api/config';

const RoomDetails = () => {
    const { roomId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [availability, setAvailability] = useState({ isAvailable: true });

    // Parse initial dates from URL
    const params = new URLSearchParams(location.search);
    const [dates, setDates] = useState({
        checkIn: params.get('checkIn') || '',
        checkOut: params.get('checkOut') || '',
        guests: params.get('guests') || 1
    });

    useEffect(() => {
        fetchRoomDetails();
        if (dates.checkIn && dates.checkOut) {
            checkAvailability();
        }
    }, [roomId]);

    const fetchRoomDetails = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/rooms/${roomId}`);
            if (res.ok) {
                const data = await res.json();
                setRoom(data);
            }
        } catch (err) {
            console.error("Failed to fetch room", err);
        } finally {
            setLoading(false);
        }
    };

    const checkAvailability = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/rooms/${roomId}/availability?checkInDate=${dates.checkIn}&checkOutDate=${dates.checkOut}`);
            if (res.ok) {
                const data = await res.json();
                setAvailability(data);
            }
        } catch (err) {
            console.error("Availability check failed", err);
        }
    };

    const handleDateChange = (e) => {
        setDates({ ...dates, [e.target.name]: e.target.value });
    };

    const handleUpdateDates = () => {
        checkAvailability();
        // Update URL to persist selection
        const query = new URLSearchParams(dates).toString();
        navigate(`/rooms/${roomId}?${query}`, { replace: true });
    };

    const handleSelectRoom = () => {
        // Redirect to checkout with room and date info
        const query = new URLSearchParams({
            roomId,
            roomName: room.name,
            ...dates,
            price: room.basePrice
        }).toString();
        navigate(`/checkout?${query}`);
    };

    if (loading) return <div className="loading">Loading room details...</div>;
    if (!room) return <div className="error">Room not found</div>;

    return (
        <div className="room-details-container">
            <Link to={`/search?${params.toString()}`} className="back-link">
                ← Back to Results
            </Link>
            <div className="room-gallery">
                <div className="main-image">
                    <img src={room.images?.[0]?.imageUrl || "/src/assets/700644344.jpg"} alt={room.name} />
                </div>
                <div className="thumbnails">
                    {room.images?.slice(1).map((img, idx) => (
                        <img key={idx} src={img.imageUrl} alt="thumbnail" />
                    ))}
                </div>
            </div>

            <div className="room-info-grid">
                <div className="room-description-side">
                    <h1>{room.name}</h1>
                    <p className="occupancy">Up to {room.maxOccupancy} Guests</p>
                    <div className="description-text">
                        <h3>About this room</h3>
                        <p>{room.description}</p>
                    </div>

                    <div className="amenities-section">
                        <h3>Amenities</h3>
                        <div className="amenities-list">
                            {room.amenities?.map(amenity => (
                                <div key={amenity.id} className="amenity-item">
                                    <span className="amenity-icon">•</span> {amenity.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="booking-sidebar">
                    <div className="price-box">
                        <span className="price">${room.basePrice}</span>
                        <span className="unit">/ night</span>
                    </div>

                    <div className="booking-form">
                        <div className="date-input">
                            <label>Check In</label>
                            <input type="date" name="checkIn" value={dates.checkIn} onChange={handleDateChange} />
                        </div>
                        <div className="date-input">
                            <label>Check Out</label>
                            <input type="date" name="checkOut" value={dates.checkOut} onChange={handleDateChange} />
                        </div>
                        <button onClick={handleUpdateDates} className="update-btn">Check Availability</button>

                        {!availability.isAvailable && (
                            <div className="availability-warning">
                                Sorry, this room is unavailable for the selected dates.
                            </div>
                        )}

                        <button
                            disabled={!availability.isAvailable || !dates.checkIn || !dates.checkOut}
                            onClick={handleSelectRoom}
                            className="select-room-btn"
                        >
                            Select Room
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomDetails;
