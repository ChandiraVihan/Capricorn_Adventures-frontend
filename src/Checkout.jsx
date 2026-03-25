import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './Checkout.css';
import { API_BASE_URL } from './api/config';

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Parse booking info from URL
    const params = new URLSearchParams(location.search);
    const bookingInfo = {
        roomId: params.get('roomId'),
        roomName: params.get('roomName') || 'Luxury Sanctuary',
        checkIn: params.get('checkIn'),
        checkOut: params.get('checkOut'),
        guests: params.get('guests'),
        price: params.get('price')
    };

    const [guestData, setGuestData] = useState({
        name: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : '',
        email: user?.email || '',
        phone: ''
    });

    const [checkoutMode, setCheckoutMode] = useState(user ? 'form' : 'choice'); // 'choice', 'login', 'form'
    const [bookingRef, setBookingRef] = useState(null);
    const [step, setStep] = useState(1); // 1: Details/Auth, 2: Payment, 3: Success
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [simulateFailure, setSimulateFailure] = useState(false);

    const calculateNights = () => {
        if (!bookingInfo.checkIn || !bookingInfo.checkOut) return 1;
        const start = new Date(bookingInfo.checkIn);
        const end = new Date(bookingInfo.checkOut);
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 1;
    };

    const totalAmount = (calculateNights() * (parseFloat(bookingInfo.price) || 0)).toFixed(2);

    const validateForm = () => {
        if (!guestData.name.trim()) return "Full name is required";
        if (!/\S+@\S+\.\S+/.test(guestData.email)) return "Invalid email format";
        if (!/^[0-9]{10,15}$/.test(guestData.phone)) return "Invalid phone number (10-15 digits)";
        return null;
    };

    const handleCreateBooking = async (e) => {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_BASE_URL}/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: bookingInfo.roomId,
                    checkInDate: bookingInfo.checkIn,
                    checkOutDate: bookingInfo.checkOut
                })
            });

            if (res.ok) {
                const data = await res.json();
                const bookingId = data.id;

                const guestRes = await fetch(`${API_BASE_URL}/checkout/${bookingId}/guest`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(guestData)
                });

                if (guestRes.ok) {
                    localStorage.setItem('pendingBookingId', bookingId);
                    setStep(2);
                } else {
                    setError("Failed to save guest details.");
                }
            } else {
                const errData = await res.json();
                setError(errData.message || "Room unavailable for these dates.");
            }
        } catch (err) {
            setError("Server connection failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmBooking = async () => {
        setLoading(true);
        setError('');
        const bookingId = localStorage.getItem('pendingBookingId');

        try {
            const res = await fetch(`${API_BASE_URL}/checkout/${bookingId}/confirm?paymentSuccess=${!simulateFailure}`, {
                method: 'POST'
            });

            if (res.ok) {
                const data = await res.json();
                setBookingRef(data.referenceId);
                localStorage.removeItem('pendingBookingId');
                setStep(3);
            } else {
                const msg = await res.text();
                setError(msg || "Payment was declined. Please try a different card.");
            }
        } catch (err) {
            setError("Confirmation failed. Check your internet connection.");
        } finally {
            setLoading(false);
        }
    };

    if (step === 3) {
        return (
            <div className="checkout-success">
                <div className="success-box">
                    <span className="success-icon">✓</span>
                    <h2>Reserved!</h2>
                    <p>Reference: <strong className="ref-code">{bookingRef}</strong></p>
                    <p>Expect your itinerary at <strong>{guestData.email}</strong> shortly.</p>
                    <button onClick={() => navigate('/home')} className="finish-btn">Return Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-container">
            <div className="checkout-layout">
                <div className="checkout-main">
                    {step === 1 && checkoutMode === 'choice' && (
                        <div className="auth-choice-section">
                            <h2>Complete Your Journey</h2>
                            <p className="choice-hint">Log in for a faster experience, or proceed as a guest.</p>
                            <div className="choice-grid">
                                <Link to={`/signin?redirect=${encodeURIComponent(location.pathname + location.search)}`} className="choice-card">
                                    <h3>Sign In</h3>
                                    <p>Access your saved profiles</p>
                                </Link>
                                <button onClick={() => setCheckoutMode('form')} className="choice-card guest">
                                    <h3>Continue as Guest</h3>
                                    <p>Fast checkout, no account needed</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 1 && checkoutMode === 'form' && (
                        <>
                            <h2>Guest Details</h2>
                            {error && <div className="checkout-error">{error}</div>}
                            <form onSubmit={handleCreateBooking} className="checkout-form">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" required value={guestData.name} onChange={(e) => setGuestData({ ...guestData, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" required value={guestData.email} onChange={(e) => setGuestData({ ...guestData, email: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="tel" required placeholder="0771234567" value={guestData.phone} onChange={(e) => setGuestData({ ...guestData, phone: e.target.value })} />
                                </div>
                                <button type="submit" disabled={loading} className="continue-btn">
                                    {loading ? "Preparing your stay..." : "Continue to Payment"}
                                </button>
                            </form>
                        </>
                    )}

                    {step === 2 && (
                        <div className="payment-placeholder">
                            <h2>Submit Payment</h2>
                            {error && <div className="checkout-error">{error}</div>}
                            <p>For this simulation, any card entry will activate the booking engine.</p>
                            <div className="card-mockup">
                                <span>•••• •••• •••• 4242</span>
                            </div>

                            <label className="failure-simulation">
                                <input type="checkbox" checked={simulateFailure} onChange={(e) => setSimulateFailure(e.target.checked)} />
                                Simulate Payment Failure
                            </label>

                            <button onClick={handleConfirmBooking} disabled={loading} className="confirm-btn">
                                {loading ? "Verifying Transaction..." : `Confirm Payment - $${totalAmount}`}
                            </button>
                            <button onClick={() => setStep(1)} className="back-btn-simple">Back to details</button>
                        </div>
                    )}
                </div>

                <div className="checkout-summary">
                    <h3>Booking Summary</h3>
                    <div className="summary-card">
                        <div className="summary-item">
                            <span className="label">Sanctuary</span>
                            <span className="value">{bookingInfo.roomName}</span>
                        </div>
                        <div className="summary-row">
                            <div className="summary-item">
                                <span className="label">Check In</span>
                                <span className="value">{bookingInfo.checkIn}</span>
                            </div>
                            <div className="summary-item">
                                <span className="label">Check Out</span>
                                <span className="value">{bookingInfo.checkOut}</span>
                            </div>
                        </div>
                        <div className="summary-item">
                            <span className="label">Guests</span>
                            <span className="value">{bookingInfo.guests} Guests</span>
                        </div>
                        <div className="summary-divider"></div>
                        <div className="summary-total">
                            <span>Total (USD)</span>
                            <span className="total-price">${totalAmount}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
