import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import './MyBookings.css';

const MyBookings = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBookings = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const token = localStorage.getItem('accessToken');
                const res = await fetch('http://localhost:8080/api/bookings/my-bookings', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setBookings(data);
                } else {
                    setError("Failed to retrieve your history.");
                }
            } catch (err) {
                setError("Server connection issues.");
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [user]);

    if (!user) {
        return (
            <div className="bookings-history-container">
                <div className="empty-history">
                    <h2>Adventure Await</h2>
                    <p>Please log in to view your booking history and upcoming stays.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bookings-history-container">
            <header className="history-header">
                <h1>My Adventures</h1>
                <p>Welcome back, {user.firstName}. Your journey history is below.</p>
            </header>

            {loading ? (
                <div className="history-loading">Authenticating Records...</div>
            ) : error ? (
                <div className="history-error">{error}</div>
            ) : bookings.length === 0 ? (
                <div className="empty-history">
                    <h2>No bookings yet.</h2>
                    <p>Your upcoming sanctuaries will appear here.</p>
                </div>
            ) : (
                <div className="history-grid">
                    {bookings.map((booking, index) => (
                        <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="history-card"
                        >
                            <div className="history-card-left">
                                <div className="status-indicator" data-status={booking.status}></div>
                                <h3>{booking.room?.name || 'Resort Stay'}</h3>
                                <div className="ref-sub">Ref: {booking.referenceId}</div>
                            </div>
                            <div className="history-card-right">
                                <div className="date-range">
                                    {booking.checkInDate} — {booking.checkOutDate}
                                </div>
                                <div className="history-price">${booking.totalPrice}</div>
                                <div className={`status-text ${booking.status.toLowerCase()}`}>{booking.status}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyBookings;
