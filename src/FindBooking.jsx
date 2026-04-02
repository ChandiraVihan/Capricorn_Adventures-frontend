import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Receipt, Calendar, User, Clock, CheckCircle, XCircle, AlertTriangle, Trash2 } from 'lucide-react';
import './FindBooking.css';
import { API_BASE_URL } from './api/config';

const FindBooking = () => {
    const [reference, setReference] = useState('');
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, loading, success, error, cancelled
    const [errorMsg, setErrorMsg] = useState('');
    const [showConfirmCancel, setShowConfirmCancel] = useState(false);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!reference.trim()) return;

        setLoading(true);
        setStatus('loading');
        setErrorMsg('');
        setBooking(null);

        try {
            const res = await fetch(`${API_BASE_URL}/v1/bookings/reference/${reference.trim()}`);
            if (res.ok) {
                const data = await res.json();
                setBooking(data);
                setStatus('success');
            } else if (res.status === 404) {
                setStatus('error');
                setErrorMsg("No booking found with this reference number. Please double-check your code.");
            } else {
                setStatus('error');
                setErrorMsg("The server encountered an issue retrieving your booking.");
            }
        } catch (err) {
            console.error("Tracking error:", err);
            setStatus('error');
            setErrorMsg("Check your internet connection. Communication with the server failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async () => {
        setCancelling(true);
        try {
            const res = await fetch(`${API_BASE_URL}/v1/bookings/reference/${booking.referenceId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setBooking(null);
                setReference('');
                setStatus('cancelled');
                setShowConfirmCancel(false);
            } else {
                alert("Failed to cancel booking. Please try again or contact support.");
            }
        } catch (err) {
            console.error("Cancellation error:", err);
            alert("Connection error. Could not reach the server to cancel your booking.");
        } finally {
            setCancelling(false);
        }
    };

    const StatusBadge = ({ status }) => {
        const config = {
            CONFIRMED: { icon: CheckCircle, color: '#10b981', bg: '#ecfdf5' },
            CANCELLED: { icon: XCircle, color: '#ef4444', bg: '#fef2f2' },
            PENDING: { icon: Clock, color: '#f59e0b', bg: '#fffbeb' }
        };
        const current = config[status] || config.PENDING;
        const Icon = current.icon;

        return (
            <div className="status-badge-premium" style={{ backgroundColor: current.bg, color: current.color }}>
                <Icon size={14} />
                <span>{status}</span>
            </div>
        );
    };

    return (
        <div className="find-booking-container">
            <div className="find-booking-glass">
                <div className="find-booking-header">
                    <Receipt size={40} className="header-icon" />
                    <h1>Retrieve Your Sanctuary</h1>
                    <p>Enter your unique reference code (e.g., CAP-XXXXXX) to view your upcoming experience.</p>
                </div>

                <form onSubmit={handleSearch} className="search-box-premium">
                    <div className="input-with-icon">
                        <Search size={20} className="input-icon" />
                        <input
                            type="text"
                            placeholder="Your Reference Number"
                            value={reference}
                            onChange={(e) => setReference(e.target.value.toUpperCase())}
                            required
                        />
                    </div>
                    <button type="submit" disabled={loading} className="search-btn-premium">
                        {loading ? "Decrypting..." : "Track Booking"}
                    </button>
                </form>

                {status === 'error' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="error-message-box"
                    >
                        <AlertTriangle size={20} />
                        <span>{errorMsg}</span>
                    </motion.div>
                )}

                {status === 'cancelled' && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }}
                        className="success-message-box"
                    >
                        <CheckCircle size={24} />
                        <div>
                            <h3>Stay Cancelled Successfully</h3>
                            <p>The sanctuary is now available for other seekers. We hope to host you another time.</p>
                        </div>
                    </motion.div>
                )}

                <AnimatePresence>
                    {booking && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="booking-card-premium"
                        >
                            <div className="card-top">
                                <div className="brand-info">
                                    <MapPin size={16} />
                                    <span>Capricorn Sanctuary • Sri Lanka</span>
                                </div>
                                <StatusBadge status={booking.status} />
                            </div>

                            <div className="card-main">
                                <div className="room-details-row">
                                    <div className="room-details">
                                        <h3>{booking.room?.name || 'Exclusive Suite'}</h3>
                                        <span className="ref-number">Ref: {booking.referenceId}</span>
                                    </div>
                                    <button 
                                        className="cancel-stay-btn" 
                                        onClick={() => setShowConfirmCancel(true)}
                                        title="Cancel My Stay"
                                    >
                                        <Trash2 size={18} />
                                        <span>Cancel My Stay</span>
                                    </button>
                                </div>

                                <div className="info-grid-premium">
                                    <div className="info-item">
                                        <Calendar size={18} />
                                        <div className="info-text">
                                            <label>Check In</label>
                                            <strong>{new Date(booking.checkInDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <Calendar size={18} />
                                        <div className="info-text">
                                            <label>Check Out</label>
                                            <strong>{new Date(booking.checkOutDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <User size={18} />
                                        <div className="info-text">
                                            <label>Reserved By</label>
                                            <strong>{booking.guestName || 'Valued Guest'}</strong>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <Receipt size={18} />
                                        <div className="info-text">
                                            <label>Total Investment</label>
                                            <strong>LKR {booking.totalPrice}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card-bottom">
                                <p>A confirmation has been dispatched to <strong>{booking.guestEmail}</strong>. Please present this reference code upon arrival.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Confirmation Modal */}
                <AnimatePresence>
                    {showConfirmCancel && (
                        <motion.div 
                            className="booking-modal-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div 
                                className="booking-modal cancel-confirmation"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                            >
                                <div className="modal-content">
                                    <AlertTriangle size={64} className="warning-icon" />
                                    <h2>Cancel Your Sanctuary?</h2>
                                    <p>Are you sure you want to cancel your stay? This action is permanent and other guests will be able to book these dates immediately.</p>
                                    
                                    <div className="modal-actions">
                                        <button 
                                            className="modal-secondary-btn" 
                                            onClick={() => setShowConfirmCancel(false)}
                                            disabled={cancelling}
                                        >
                                            Keep My Booking
                                        </button>
                                        <button 
                                            className="modal-danger-btn" 
                                            onClick={handleCancelBooking}
                                            disabled={cancelling}
                                        >
                                            {cancelling ? "Processing..." : "Yes, Cancel Stay"}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FindBooking;
