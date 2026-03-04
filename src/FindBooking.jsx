import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './FindBooking.css';

const FindBooking = () => {
    const [reference, setReference] = useState('');
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!reference.trim()) return;

        setLoading(true);
        setError('');
        setBooking(null);

        try {
            const res = await fetch(`http://localhost:8080/api/bookings/reference/${reference.trim()}`);
            if (res.ok) {
                const data = await res.json();
                setBooking(data);
            } else {
                setError("Booking not found. Please check your reference ID.");
            }
        } catch (err) {
            setError("Communication error with server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="find-booking-container">
            <div className="find-booking-header">
                <h1>Find My Booking</h1>
                <p>Enter your unique reference code to retrieve your sanctuary details.</p>
            </div>

            <form onSubmit={handleSearch} className="search-form-compact">
                <input
                    type="text"
                    placeholder="Reference (e.g., CAP-XXXXXX)"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Searching..." : "Track Stay"}
                </button>
            </form>

            {error && <div className="find-error">{error}</div>}

            <AnimatePresence>
                {booking && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="booking-result-card"
                    >
                        <div className="result-main">
                            <div className="resort-label">Capricorn Sanctuary</div>
                            <h2>{booking.room?.name || 'Luxury Room'}</h2>
                            <div className="ref-badge">{booking.referenceId}</div>
                        </div>

                        <div className="details-grid">
                            <div className="detail-item">
                                <span className="label">Check In</span>
                                <span className="value">{booking.checkInDate}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Check Out</span>
                                <span className="value">{booking.checkOutDate}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Guest</span>
                                <span className="value">{booking.guestName}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Status</span>
                                <span className={`status-pill ${booking.status.toLowerCase()}`}>
                                    {booking.status}
                                </span>
                            </div>
                        </div>

                        <div className="result-footer">
                            <div className="price-tag">
                                <span className="label">Total Amount</span>
                                <span className="value">${booking.totalPrice}</span>
                            </div>
                            <p className="footer-note">A copy of these details has been sent to {booking.guestEmail}.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FindBooking;
