import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import './MyBookings.css';
import { adventureService } from './api/adventureService';
import { bookingService } from './api/bookingService';

const toTitleCase = (value) => (value ? String(value).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : '-');

const lkrFormatter = new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
});

const formatLkr = (value) => lkrFormatter.format(Number(value || 0));

const formatDateTime = (value) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return parsed.toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getBookingId = (booking) => booking?.bookingId ?? booking?.id;

const MyBookings = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [bookingType, setBookingType] = useState('HOTEL');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [selectedDetails, setSelectedDetails] = useState(null);
    const [rescheduleOptions, setRescheduleOptions] = useState([]);
    const [selectedScheduleId, setSelectedScheduleId] = useState('');
    const [restrictionMessage, setRestrictionMessage] = useState('');
    const [actionMessage, setActionMessage] = useState('');
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchBookings = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
        setActionMessage('');

        try {
            const data = await adventureService.getMyBookings(bookingType);
            const rows = Array.isArray(data) ? data : [];
            setBookings(rows);

            if (bookingType === 'ADVENTURE') {
                const firstAdventureBookingId = getBookingId(rows[0]);
                setSelectedBookingId(firstAdventureBookingId || null);
            } else {
                const firstHotelBookingId = getBookingId(rows[0]);
                setSelectedBookingId(firstHotelBookingId || null);
            }
        } catch {
            setError('Server connection issues.');
        } finally {
            setLoading(false);
        }
    };

    const loadBookingDetails = async (bookingId) => {
        if (!bookingId) {
            setSelectedDetails(null);
            setRescheduleOptions([]);
            setSelectedScheduleId('');
            setRestrictionMessage('');
            return;
        }

        setDetailsLoading(true);
        setActionMessage('');
        setError('');

        try {
            if (bookingType === 'ADVENTURE') {
                const [details, options] = await Promise.all([
                    adventureService.getAdventureBookingDetails(bookingId),
                    adventureService.getAdventureRescheduleOptions(bookingId),
                ]);

                const availableSlots = Array.isArray(options?.availableSlots) ? options.availableSlots : [];
                setSelectedDetails(details || null);
                setRescheduleOptions(availableSlots);
                setRestrictionMessage(details?.restrictionMessage || options?.message || '');
                setSelectedScheduleId(availableSlots[0]?.scheduleId ? String(availableSlots[0].scheduleId) : '');
            } else {
                const details = await bookingService.getRoomBookingDetails(bookingId);
                setSelectedDetails(details || null);
                setRescheduleOptions([]);
                setRestrictionMessage(details?.restrictionMessage || '');
            }
        } catch (detailsError) {
            setSelectedDetails(null);
            setRescheduleOptions([]);
            setSelectedScheduleId('');
            setRestrictionMessage('');
            setError(detailsError.message || 'Unable to load booking details.');
        } finally {
            setDetailsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [user, bookingType]);

    useEffect(() => {
        if (selectedBookingId) {
            loadBookingDetails(selectedBookingId);
        }
    }, [bookingType, selectedBookingId]);

    const getBookingTitle = (booking) => {
        if (bookingType === 'ADVENTURE') {
            return booking.adventure?.title || booking.adventureName || 'Adventure Booking';
        }
        return booking.room?.name || booking.hotelName || 'Resort Stay';
    };

    const getBookingDates = (booking) => {
        if (bookingType === 'ADVENTURE') {
            const selectedDate = booking.selectedDate || booking.date || '-';
            const selectedTime = booking.selectedTime || booking.time || '-';
            return `${selectedDate} ${selectedTime}`;
        }
        return `${booking.checkInDate || '-'} — ${booking.checkOutDate || '-'}`;
    };

    const getBookingPrice = (booking) => booking.totalPrice ?? booking.price ?? 0;

    const handleReschedule = async () => {
        if (!selectedBookingId || !selectedScheduleId) {
            setError('Select a new slot to continue.');
            return;
        }

        setActionLoading(true);
        setError('');
        setActionMessage('');

        try {
            const response = await adventureService.rescheduleAdventureBooking(selectedBookingId, Number(selectedScheduleId));
            setActionMessage(response?.message || 'Booking rescheduled successfully.');
            await fetchBookings();
            await loadBookingDetails(selectedBookingId);
        } catch (actionError) {
            setError(actionError.message || 'Unable to reschedule booking.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!selectedBookingId) return;

        const reason = window.prompt('Please provide a reason for cancellation/refund:', 'Change of plans');
        if (reason === null) return; // User cancelled prompt

        setActionLoading(true);
        setError('');
        setActionMessage('');

        try {
            let response;
            if (bookingType === 'ADVENTURE') {
                response = await adventureService.requestAdventureRefund(selectedBookingId, reason);
            } else {
                response = await bookingService.requestRoomRefund(selectedBookingId, reason);
            }
            setActionMessage(response?.message || 'Cancellation and refund request processed successfully.');
            await fetchBookings();
            
            // Re-select to update details view
            await loadBookingDetails(selectedBookingId);
        } catch (actionError) {
            setError(actionError.message || 'Unable to process refund request.');
        } finally {
            setActionLoading(false);
        }
    };

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
                <div className="booking-type-toggle" style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    <button
                        type="button"
                        onClick={() => setBookingType('HOTEL')}
                        style={{
                            border: '1px solid #1c124d',
                            background: bookingType === 'HOTEL' ? '#1c124d' : '#fff',
                            color: bookingType === 'HOTEL' ? '#fff' : '#1c124d',
                            borderRadius: '999px',
                            padding: '6px 14px',
                            cursor: 'pointer'
                        }}
                    >
                        Hotel
                    </button>
                    <button
                        type="button"
                        onClick={() => setBookingType('ADVENTURE')}
                        style={{
                            border: '1px solid #1c124d',
                            background: bookingType === 'ADVENTURE' ? '#1c124d' : '#fff',
                            color: bookingType === 'ADVENTURE' ? '#fff' : '#1c124d',
                            borderRadius: '999px',
                            padding: '6px 14px',
                            cursor: 'pointer'
                        }}
                    >
                        Adventure
                    </button>
                </div>
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
                <div className="history-management-layout">
                    <div className="history-grid">
                        {bookings.map((booking, index) => {
                            const id = getBookingId(booking);
                            const isSelected = bookingType === 'ADVENTURE' && id === selectedBookingId;

                            return (
                                <motion.div
                                    key={id || index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.06 }}
                                    className={`history-card ${id === selectedBookingId ? 'selected' : ''}`}
                                    onClick={() => setSelectedBookingId(id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            setSelectedBookingId(id);
                                        }
                                    }}
                                >
                                    <div className="history-card-left">
                                        <div className="status-indicator" data-status={booking.status}></div>
                                        <h3>{getBookingTitle(booking)}</h3>
                                        <div className="ref-sub">Ref: {booking.referenceId || booking.reference || booking.bookingReference || '-'}</div>
                                    </div>
                                    <div className="history-card-right">
                                        <div className="date-range">
                                            {getBookingDates(booking)}
                                        </div>
                                        <div className="history-price">
                                            {booking.refundedAmount > 0 && (
                                                <div className="refund-amount-text">Refunded: {formatLkr(booking.refundedAmount)}</div>
                                            )}
                                            {formatLkr(getBookingPrice(booking))}
                                        </div>
                                        <div className={`status-text ${(booking.status || 'pending').toLowerCase()}`}>{booking.status || 'PENDING'}</div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                    {selectedBookingId && (
                        <aside className="booking-management-panel">
                            <h2>Manage Booking</h2>

                            {detailsLoading ? (
                                <p>Loading booking details...</p>
                            ) : !selectedDetails ? (
                                <p>Select an adventure booking to view details.</p>
                            ) : (
                                <>
                                    <div className="management-block">
                                        <h3>{bookingType === 'ADVENTURE' ? (selectedDetails?.adventureName || 'Adventure booking') : (selectedDetails?.roomName || 'Room stay')}</h3>
                                        {bookingType === 'ADVENTURE' ? (
                                            <>
                                                <p><strong>Date / time:</strong> {formatDateTime(selectedDetails?.startDateTime)}</p>
                                                <p><strong>Participants:</strong> {selectedDetails?.participants ?? '-'}</p>
                                                <p><strong>Provider:</strong> {selectedDetails?.providerInfo || 'Capricorn Adventures'}</p>
                                                <p><strong>Meeting point:</strong> {selectedDetails?.meetingPoint || '-'}</p>
                                            </>
                                        ) : (
                                            <>
                                                <p><strong>Check-in:</strong> {selectedDetails?.checkInDate}</p>
                                                <p><strong>Check-out:</strong> {selectedDetails?.checkOutDate}</p>
                                                <p><strong>Reference:</strong> {selectedDetails?.referenceId}</p>
                                            </>
                                        )}
                                        <p><strong>Status:</strong> {toTitleCase(selectedDetails?.status || bookings.find(b => getBookingId(b) === selectedBookingId)?.status)}</p>
                                    </div>

                                    {restrictionMessage && (
                                        <div className="restriction-banner">
                                            {restrictionMessage}
                                        </div>
                                    )}

                                    {actionMessage && (
                                        <div className="success-banner">
                                            {actionMessage}
                                        </div>
                                    )}

                                    {bookingType === 'ADVENTURE' && (
                                        <div className="management-block">
                                            <h4>Reschedule</h4>
                                            {rescheduleOptions.length > 0 ? (
                                                <>
                                                    <select
                                                        value={selectedScheduleId}
                                                        onChange={(event) => setSelectedScheduleId(event.target.value)}
                                                        className="reschedule-select"
                                                        disabled={actionLoading || selectedDetails.rescheduleAllowed === false}
                                                    >
                                                        {rescheduleOptions.map((slot) => (
                                                            <option key={slot.scheduleId} value={slot.scheduleId}>
                                                                {formatDateTime(slot.startDateTime)} ({slot.availableSlots} slots left)
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={handleReschedule}
                                                        className="action-btn"
                                                        disabled={actionLoading || !selectedScheduleId || selectedDetails.rescheduleAllowed === false}
                                                    >
                                                        {actionLoading ? 'Updating...' : 'Reschedule Booking'}
                                                    </button>
                                                </>
                                            ) : (
                                                <p className="muted-text">No alternative slots available.</p>
                                            )}
                                        </div>
                                    )}

                                    <div className="management-block">
                                        <h4>Cancellation & Refund</h4>
                                        <p className="muted-text" style={{ fontSize: '0.8rem', marginBottom: '10px' }}>
                                            Cancellation policies apply. Refunds may be partial depending on notice period.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="action-btn cancel"
                                            disabled={actionLoading || (selectedDetails && selectedDetails.cancelAllowed === false)}
                                        >
                                            {actionLoading ? 'Processing...' : 'Cancel & Request Refund'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </aside>
                    )}
                </div>
            )}
        </div>
    );
};

export default MyBookings;
