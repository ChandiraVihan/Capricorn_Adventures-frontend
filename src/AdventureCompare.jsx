import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './AdventureCompare.css';
import { adventureService } from './api/adventureService';

const COMPARE_TRAY_KEY = 'compareTrayV1';

const lkrFormatter = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 0,
});

const formatLkr = (value) => lkrFormatter.format(Number(value || 0));

const readTray = () => {
  try {
    const raw = sessionStorage.getItem(COMPARE_TRAY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => x && typeof x === 'object' && x.id) : [];
  } catch {
    return [];
  }
};

const parseIds = (search) => {
  const params = new URLSearchParams(search);
  const ids = (params.get('ids') || '')
    .split(',')
    .map((x) => decodeURIComponent(x.trim()))
    .filter(Boolean);
  return ids;
};

const normalizeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const normalizeSlotForCheckout = (slot, index = 0) => {
  // Supports both "new backend" and "legacy" shapes (mirrors AdventureDetails logic)
  if (slot && typeof slot === 'object' && 'scheduleId' in slot && 'startDate' in slot) {
    const start = new Date(slot.startDate);
    const end = slot.endDate ? new Date(slot.endDate) : null;
    const pad = (n) => n.toString().padStart(2, '0');
    const dateStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    const timeStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`;

    return {
      id: slot.scheduleId || `slot-${index}`,
      date: dateStr,
      time: timeStr,
      available: slot.available !== false && slot.status !== 'FULL' && (slot.availableSlots ?? 0) > 0,
      remainingCapacity: slot.availableSlots ?? 0,
      endDate: end,
      status: slot.status,
    };
  }

  return {
    id: slot?.id || `${slot?.date || 'date'}-${slot?.time || slot?.startTime || 'time'}-${index}`,
    date: slot?.date || slot?.day || '',
    time: slot?.time || slot?.startTime || '',
    capacity: slot?.capacity ?? slot?.maxCapacity ?? 0,
    available: slot?.available ?? slot?.isAvailable ?? (slot?.remainingCapacity > 0),
    remainingCapacity: slot?.remainingCapacity ?? slot?.capacityLeft ?? 0,
  };
};

const winnerIndex = (rowKey, items) => {
  const values = items.map((it) => {
    switch (rowKey) {
      case 'price':
        return normalizeNumber(it.price);
      case 'distance':
        return normalizeNumber(it.distance);
      case 'duration':
        return normalizeNumber(it.durationHours);
      case 'rating':
        return normalizeNumber(it.rating);
      case 'availability':
        return it.availability ? 1 : 0;
      default:
        return null;
    }
  });

  const candidates = values
    .map((v, idx) => ({ v, idx }))
    .filter(({ v }) => v !== null && v !== undefined);

  if (candidates.length === 0) return -1;

  const best =
    rowKey === 'rating' || rowKey === 'availability'
      ? candidates.reduce((acc, cur) => (cur.v > acc.v ? cur : acc))
      : candidates.reduce((acc, cur) => (cur.v < acc.v ? cur : acc));

  return best.idx;
};

const AdventureCompare = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredRow, setHoveredRow] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const ids = useMemo(() => parseIds(location.search), [location.search]);
  const tray = useMemo(() => readTray(), []);

  const selected = useMemo(() => {
    if (!ids.length) return tray.slice(0, 3);
    const map = new Map(tray.map((x) => [String(x.id), x]));
    return ids.map((id) => map.get(String(id))).filter(Boolean).slice(0, 3);
  }, [ids, tray]);

  const rows = useMemo(
    () => [
      { key: 'price', label: 'Price', format: (x) => formatLkr(x.price) },
      { key: 'distance', label: 'Distance', format: (x) => (x.distance != null ? `${x.distance} km` : '—') },
      { key: 'duration', label: 'Duration', format: (x) => `${Number(x.durationHours || 0)}h` },
      { key: 'difficulty', label: 'Difficulty', format: (x) => x.difficulty || '—' },
      { key: 'rating', label: 'Rating', format: (x) => `${Number(x.rating || 0).toFixed(1)} (${x.reviewCount || 0})` },
      { key: 'availability', label: 'Availability', format: (x) => (x.availability ? 'Available' : 'Unavailable') },
    ],
    [],
  );

  const handleBook = async (adv) => {
    if (!adv?.id) return;
    setBookingLoading(true);
    try {
      const schedules = await adventureService.getSchedules(adv.id);
      const normalized = Array.isArray(schedules)
        ? schedules.map((s, idx) => normalizeSlotForCheckout(s, idx))
        : [];

      const pick =
        normalized.find((s) => s?.available && s?.id && s?.date && s?.time) ||
        normalized.find((s) => s?.id && s?.date && s?.time) ||
        null;

      if (!pick) {
        navigate(`/adventures/${adv.id}`);
        return;
      }

      const ageToSend = adv?.minAge != null ? String(adv.minAge) : '0';

      navigate(`/adventures/checkout?${new URLSearchParams({
        adventureId: String(adv.id),
        adventureTitle: adv.title || 'Adventure Experience',
        slotId: String(pick.id),
        date: String(pick.date),
        time: String(pick.time),
        participants: '1',
        price: String(adv.price || 0),
        age: ageToSend,
      }).toString()}`);
    } catch (err) {
      // If schedule lookup fails, fall back to the details page
      navigate(`/adventures/${adv.id}`);
    } finally {
      setBookingLoading(false);
    }
  };

  if (selected.length === 0) {
    return (
      <div className="compare-page">
        <div className="compare-shell">
          <h2>Adventure Comparison</h2>
          <p className="compare-sub">No adventures selected for comparison.</p>
          <Link to="/adventures" className="compare-back-link">← Back to Adventures</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="compare-page">
      <div className="compare-shell">
        <div className="compare-header">
          <div>
            <h2>Adventure Comparison</h2>
            <p className="compare-sub">Side-by-side comparison for price, distance, duration, rating and availability.</p>
          </div>
          <div className="compare-header-actions">
            <button type="button" className="compare-clear" onClick={() => { sessionStorage.removeItem(COMPARE_TRAY_KEY); navigate('/adventures'); }}>
              Clear & return
            </button>
          </div>
        </div>

        <div className="compare-table-wrap" role="region" aria-label="Comparison table">
          <table className="compare-table">
            <thead>
              <tr>
                <th className="sticky-col">Feature</th>
                {selected.map((adv) => (
                  <th key={adv.id}>
                    <div className="compare-col-title">{adv.title}</div>
                    <button
                      type="button"
                      className="compare-book"
                      onClick={() => handleBook(adv)}
                      disabled={bookingLoading}
                    >
                      Book
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const winIdx = winnerIndex(row.key, selected);
                return (
                  <tr
                    key={row.key}
                    className={hoveredRow === row.key ? 'row-hover' : ''}
                    onMouseEnter={() => setHoveredRow(row.key)}
                    onMouseLeave={() => setHoveredRow('')}
                  >
                    <td className="sticky-col row-label">{row.label}</td>
                    {selected.map((adv, idx) => (
                      <td
                        key={`${row.key}-${adv.id}`}
                        className={hoveredRow === row.key && idx === winIdx ? 'cell-winner' : ''}
                      >
                        {row.format(adv)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Link to="/adventures" className="compare-back-link">← Back to Adventures</Link>
      </div>
    </div>
  );
};

export default AdventureCompare;

