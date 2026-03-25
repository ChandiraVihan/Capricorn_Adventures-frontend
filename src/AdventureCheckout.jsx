import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './Checkout.css';
import { adventureService } from './api/adventureService';

const lkrFormatter = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 0,
});

const formatLkr = (value) => lkrFormatter.format(Number(value || 0));

const AdventureCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const params = new URLSearchParams(location.search);
  const bookingInfo = {
    adventureId: params.get('adventureId'),
    adventureTitle: params.get('adventureTitle') || 'Adventure Experience',
    slotId: params.get('slotId'),
    date: params.get('date'),
    time: params.get('time'),
    participants: params.get('participants') || '1',
    age: params.get('age') || '',
    price: params.get('price') || '0',
  };

  const [guestData, setGuestData] = useState({
    name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
    email: user?.email || '',
    phone: '',
  });

  const [step, setStep] = useState(1);
  const [checkoutMode, setCheckoutMode] = useState(user ? 'form' : 'choice');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [bookingRef, setBookingRef] = useState(null);
  const [checkoutId, setCheckoutId] = useState(null);
  const [summaryDetails, setSummaryDetails] = useState(null);

  const totalAmount = (Number(bookingInfo.price || 0) * Number(bookingInfo.participants || 1)).toFixed(2);

  const validateForm = () => {
    if (!guestData.name.trim()) return 'Full name is required';
    if (!/\S+@\S+\.\S+/.test(guestData.email)) return 'Invalid email format';
    if (!/^[0-9]{10,15}$/.test(guestData.phone)) return 'Invalid phone number (10-15 digits)';
    return null;
  };

  const startAdventureCheckout = async () => {
    const payload = {
      adventureId: bookingInfo.adventureId,
      slotId: bookingInfo.slotId,
      selectedDate: bookingInfo.date,
      selectedTime: bookingInfo.time,
      participantCount: Number(bookingInfo.participants || 1),
      age: Number(bookingInfo.age || 0),
    };
    return adventureService.startCheckout(payload);
  };

  const updateSummary = async (currentCheckoutId) => {
    const summary = await adventureService.getCheckoutSummary(currentCheckoutId);
    if (summary) {
      setSummaryDetails(summary);
    }
  };

  const handleCreateBooking = async (event) => {
    event.preventDefault();
    const formError = validateForm();
    if (formError) {
      setError(formError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newCheckoutId = await startAdventureCheckout();
      const normalizedCheckoutId = String(newCheckoutId);

      if (user) {
        await adventureService.attachUser(normalizedCheckoutId);
      } else {
        await adventureService.updateGuestDetails(normalizedCheckoutId, guestData);
      }

      await updateSummary(normalizedCheckoutId);

      setCheckoutId(normalizedCheckoutId);
      localStorage.setItem('pendingAdventureCheckoutId', normalizedCheckoutId);
      setStep(2);
    } catch (createError) {
      setError(createError.message || 'Unable to create adventure booking.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    const activeCheckoutId = checkoutId || localStorage.getItem('pendingAdventureCheckoutId');
    if (!activeCheckoutId) {
      setError('Booking session expired. Please start again.');
      setStep(1);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await adventureService.confirmCheckout(activeCheckoutId, !simulateFailure);
      const reference = data?.referenceId || data?.bookingReference || data?.reference || `ADV-${activeCheckoutId}`;
      setBookingRef(reference);
      localStorage.removeItem('pendingAdventureCheckoutId');
      setStep(3);
    } catch (confirmError) {
      setError(confirmError.message || 'Confirmation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="checkout-success">
        <div className="success-box">
          <span className="success-icon">✓</span>
          <h2>Adventure Confirmed!</h2>
          <p>Reference: <strong className="ref-code">{bookingRef}</strong></p>
          <p>Meeting point: Harbor gate 2, arrive 30 minutes before departure.</p>
          <p>What to bring: ID, sun protection, and comfortable footwear.</p>
          <button onClick={() => navigate('/adventures')} className="finish-btn">Explore More Adventures</button>
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
              <h2>Adventure Checkout</h2>
              <p className="choice-hint">Log in to auto-fill details, or continue as guest.</p>
              <div className="choice-grid">
                <Link to={`/signin?redirect=${encodeURIComponent(location.pathname + location.search)}`} className="choice-card">
                  <h3>Sign In</h3>
                  <p>Use your saved profile details</p>
                </Link>
                <button onClick={() => setCheckoutMode('form')} className="choice-card guest">
                  <h3>Continue as Guest</h3>
                  <p>Proceed without creating an account</p>
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
                  {loading ? 'Preparing your adventure...' : 'Continue to Payment'}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <div className="payment-placeholder">
              <h2>Submit Payment</h2>
              {error && <div className="checkout-error">{error}</div>}
              <p>Complete payment to secure your selected departure slot.</p>
              <div className="card-mockup">
                <span>•••• •••• •••• 4242</span>
              </div>

              <label className="failure-simulation">
                <input type="checkbox" checked={simulateFailure} onChange={(e) => setSimulateFailure(e.target.checked)} />
                Simulate Payment Failure
              </label>

              <button onClick={handleConfirmBooking} disabled={loading} className="confirm-btn">
                {loading ? 'Verifying Transaction...' : `Confirm Payment - ${formatLkr(totalAmount)}`}
              </button>
              <button onClick={() => setStep(1)} className="back-btn-simple">Back to details</button>
            </div>
          )}
        </div>

        <div className="checkout-summary">
          <h3>Adventure Summary</h3>
          <div className="summary-card">
            <div className="summary-item">
              <span className="label">Adventure</span>
              <span className="value">{summaryDetails?.adventureTitle || summaryDetails?.adventureName || bookingInfo.adventureTitle}</span>
            </div>
            <div className="summary-row">
              <div className="summary-item">
                <span className="label">Date</span>
                <span className="value">{summaryDetails?.selectedDate || bookingInfo.date || '-'}</span>
              </div>
              <div className="summary-item">
                <span className="label">Time</span>
                <span className="value">{summaryDetails?.selectedTime || bookingInfo.time || '-'}</span>
              </div>
            </div>
            <div className="summary-item">
              <span className="label">Participants</span>
              <span className="value">{summaryDetails?.participantCount || bookingInfo.participants}</span>
            </div>
            <div className="summary-item">
              <span className="label">Age</span>
              <span className="value">{bookingInfo.age || '-'}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-total">
              <span>Total (LKR)</span>
              <span className="total-price">{formatLkr(summaryDetails?.totalPrice || totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdventureCheckout;
