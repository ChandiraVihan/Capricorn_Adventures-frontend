import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import './AdventureDetails.css';
import defaultAdventureImage from './assets/1144044-12fb5cf4-fbd4-421a-bd23-76d6d164b227.avif';
import localImage1 from './assets/1.jpg';
import localImage2 from './assets/2d.jpg';
import localImage3 from './assets/images (1).jpg';
import localImage4 from './assets/700644344.jpg';
import localImage5 from './assets/700644293.jpg';
import localImage6 from './assets/whale-watching-sri-lanka.webp';
import { useNavigate } from 'react-router-dom';
import { adventureService } from './api/adventureService';

const lkrFormatter = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 0,
});

const formatLkr = (value) => lkrFormatter.format(Number(value || 0));

const localAdventureImages = [localImage1, localImage2, localImage3, localImage4, localImage5, localImage6];

const hashString = (value) => {
  const input = String(value || 'default');
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const pickRandomImagesForAdventure = (seedValue, count = 4) => {
  const seed = hashString(seedValue);
  const pool = [...localAdventureImages];
  const chosen = [];

  while (pool.length > 0 && chosen.length < count) {
    const index = (seed + chosen.length * 7) % pool.length;
    chosen.push(pool[index]);
    pool.splice(index, 1);
  }

  return chosen.length ? chosen : [defaultAdventureImage];
};

const toList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(/,|\n|\r\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeAdventure = (item) => {
  const normalizedId = item?.id || item?.adventureId || item?._id;
  const normalizedTitle = item?.title || item?.name || 'Adventure';

  return {
  id: normalizedId,
  title: item?.title || item?.name || 'Adventure',
  description: item?.description || item?.summary || 'No details available right now.',
  location: item?.location || item?.destination || 'Location TBA',
  difficulty: item?.difficulty || item?.difficultyLevel || 'Moderate',
  minAge: item?.minAge || item?.ageRestriction?.min || 0,
  maxAge: item?.maxAge || item?.ageRestriction?.max || null,
  price: item?.price || item?.basePrice || 0,
  isActive: item?.isActive !== false && item?.status !== 'INACTIVE',
  inclusions: toList(item?.inclusions || item?.includes),
  itinerary: toList(item?.itinerary || item?.highlights),
  photos: pickRandomImagesForAdventure(`${normalizedId}-${normalizedTitle}`),
};
};

const normalizeSlot = (slot, index) => {
  // Support both legacy and new scheduleSlots shape
  if (slot && typeof slot === 'object' && 'scheduleId' in slot && 'startDate' in slot) {
    // New backend shape
    const start = new Date(slot.startDate);
    const end = slot.endDate ? new Date(slot.endDate) : null;
    const pad = (n) => n.toString().padStart(2, '0');
    const dateStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    const timeStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
    return {
      id: slot.scheduleId || `slot-${index}`,
      date: dateStr,
      time: timeStr,
      capacity: slot.availableSlots ?? 0,
      available: slot.available !== false && slot.status !== 'FULL' && (slot.availableSlots ?? 0) > 0,
      remainingCapacity: slot.availableSlots ?? 0,
      status: slot.status,
      disabled: slot.disabled,
      disabledReason: slot.disabledReason,
      endDate: end,
    };
  }
  // Fallback to legacy shape
  return {
    id: slot?.id || `${slot?.date || 'date'}-${slot?.time || 'time'}-${index}`,
    date: slot?.date || slot?.day || '',
    time: slot?.time || slot?.startTime || '',
    capacity: slot?.capacity ?? slot?.maxCapacity ?? 0,
    available: slot?.available ?? slot?.isAvailable ?? (slot?.remainingCapacity > 0),
    remainingCapacity: slot?.remainingCapacity ?? slot?.capacityLeft ?? 0,
  };
};

const extractSlotsFromAdventure = (adventurePayload) => {
  const candidates =
    adventurePayload?.upcomingSlots ||
    adventurePayload?.schedule ||
    adventurePayload?.departureSlots ||
    adventurePayload?.timeSlots ||
    adventurePayload?.availability ||
    adventurePayload?.scheduleSlots ||
    [];

  if (!Array.isArray(candidates)) {
    return [];
  }

  return candidates.map((slot, index) => normalizeSlot(slot, index));
};

const fallbackSlots = [
  { id: 'slot-1', date: '2026-04-06', time: '06:00', capacity: 20, available: true, remainingCapacity: 8 },
  { id: 'slot-2', date: '2026-04-07', time: '14:30', capacity: 20, available: false, remainingCapacity: 0 },
  { id: 'slot-3', date: '2026-04-09', time: '06:30', capacity: 20, available: true, remainingCapacity: 12 },
];

const AdventureDetails = () => {
  const { adventureId } = useParams();
  const navigate = useNavigate();
  const [adventure, setAdventure] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdventureDetails();
  }, [adventureId]);

  const fetchAdventureDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const today = new Date();
      const fromDate = today.toISOString().split('T')[0];
      const future = new Date(today);
      future.setDate(today.getDate() + 30);
      const toDate = future.toISOString().split('T')[0];

      const data = await adventureService.getAdventureDetails(adventureId, fromDate, toDate);
      setAdventure(normalizeAdventure(data));
      setSlots(extractSlotsFromAdventure(data));
    } catch {
      setAdventure({
        id: adventureId,
        title: 'Adventure details coming soon',
        description: 'We are updating this experience. Please check back shortly.',
        location: 'Sri Lanka',
        difficulty: 'Moderate',
        minAge: 12,
        maxAge: null,
        price: 0,
        isActive: false,
        inclusions: ['Guide support', 'Safety briefing', 'Light refreshments'],
        itinerary: ['Arrival and check-in', 'Briefing and gear setup', 'Guided experience'],
        photos: pickRandomImagesForAdventure(adventureId),
      });
      setSlots(fallbackSlots);
      setError('Live details could not be loaded. Showing a preview format instead.');
    } finally {
      setLoading(false);
    }
  };

  const activePhoto = useMemo(() => {
    if (!adventure) return defaultAdventureImage;
    return adventure.photos?.[0] || defaultAdventureImage;
  }, [adventure]);

  const ageMessage = useMemo(() => {
    if (!adventure || !age) return '';
    const numericAge = Number(age);
    if (numericAge < adventure.minAge) return `Minimum age is ${adventure.minAge}.`;
    if (adventure.maxAge && numericAge > adventure.maxAge) return `Maximum age is ${adventure.maxAge}.`;
    return 'Age requirement satisfied.';
  }, [adventure, age]);

  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId);
  const ageValid = age && ageMessage === 'Age requirement satisfied.';
  const canBook = !!adventure?.isActive && !!selectedSlot?.available && ageValid;

  const handleBook = () => {
    if (!canBook) return;
    validateAndNavigate();
  };

  const validateAndNavigate = async () => {
    try {
      setError('');
      const validationPayload = {
        slotId: selectedSlot?.id,
        selectedDate: selectedSlot?.date,
        selectedTime: selectedSlot?.time,
        participants: 1,
        age: Number(age),
      };

      const validation = await adventureService.validateBooking(adventure.id, validationPayload);
      const allowed =
        validation?.allowed !== false &&
        validation?.valid !== false &&
        validation?.canBook !== false;

      if (!allowed) {
        setError(validation?.message || 'Booking rules were not met for this slot. Please choose another option.');
        return;
      }

      const query = new URLSearchParams({
        adventureId: String(adventure.id),
        adventureTitle: adventure.title,
        slotId: String(selectedSlot.id),
        date: selectedSlot.date,
        time: selectedSlot.time,
        participants: '1',
        price: String(adventure.price || 0),
        age: String(age),
      }).toString();

      navigate(`/adventures/checkout?${query}`);
    } catch (validationError) {
      setError(validationError.message || 'Unable to validate booking rules at the moment.');
    }
  };

  if (loading) return <div className="loading">Loading adventure details...</div>;
  if (!adventure) return <div className="error">Adventure not found.</div>;

  return (
    <div className="adventure-details-container">
      <Link to="/adventures" className="back-link">← Back to Adventures</Link>

      {!adventure.isActive && (
        <div className="inactive-banner">This adventure is no longer bookable.</div>
      )}

      {error && <div className="warning-banner">{error}</div>}

      <section className="details-card-shell">
        <div className="adventure-gallery">
          <div className="main-image">
            <img src={activePhoto} alt={adventure.title} />
          </div>
          <div className="thumbnails">
            {(adventure.photos?.length ? adventure.photos : [defaultAdventureImage]).slice(0, 4).map((photo, idx) => (
              <img key={`${adventure.id}-photo-${idx}`} src={photo} alt={`${adventure.title} ${idx + 1}`} />
            ))}
          </div>
        </div>

        <div className="quick-facts-row">
          <div className="fact-chip">📍 {adventure.location}</div>
          <div className="fact-chip">🧭 {adventure.difficulty}</div>
          <div className="fact-chip">👶 Min age {adventure.minAge}</div>
          <div className="fact-chip">💵 {formatLkr(adventure.price)}/person</div>
        </div>

        <div className="adventure-info-grid">
          <section className="adventure-description-side">
            <h1>{adventure.title}</h1>
            <p className="meta-line">{adventure.location} · {adventure.difficulty} difficulty</p>
            <p className="description-text">{adventure.description}</p>

            <div className="info-block">
              <h3>Age restrictions</h3>
              <p>Minimum age: {adventure.minAge}</p>
              <p>Maximum age: {adventure.maxAge || 'No upper limit'}</p>
            </div>

            <div className="info-block">
              <h3>Inclusions</h3>
              <ul>
                {(adventure.inclusions.length ? adventure.inclusions : ['Professional guide', 'Safety gear']).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="info-block">
              <h3>Itinerary</h3>
              <ul>
                {(adventure.itinerary.length ? adventure.itinerary : ['Meet at departure point', 'Briefing', 'Adventure session']).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <aside className="booking-sidebar">
            <div className="price-box">
              <span className="price">{formatLkr(adventure.price)}</span>
              <span className="unit">/ person</span>
            </div>

            <div className="booking-form">
              <h3>Upcoming schedule</h3>
              <div className="slots-list">
                {slots.map((slot) => {
                  const disabled = !slot.available;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={disabled || !adventure.isActive}
                      className={`slot-item ${selectedSlotId === slot.id ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                      onClick={() => setSelectedSlotId(slot.id)}
                    >
                      <span>{slot.date} · {slot.time}</span>
                      <small>{disabled ? 'Unavailable' : `${slot.remainingCapacity}/${slot.capacity} left`}</small>
                    </button>
                  );
                })}
              </div>

              <div className="age-check">
                <label>Your age</label>
                <input type="number" min="0" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Enter age" />
                {age && <p className={`age-message ${ageValid ? 'valid' : 'invalid'}`}>{ageMessage}</p>}
              </div>

              <button type="button" className="select-room-btn" disabled={!canBook} onClick={handleBook}>
                Continue to Booking
              </button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default AdventureDetails;
