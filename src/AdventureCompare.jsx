import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './AdventureCompare.css';

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
      { key: 'rating', label: 'Rating', format: (x) => `${Number(x.rating || 0).toFixed(1)} (${x.reviewCount || 0})` },
      { key: 'availability', label: 'Availability', format: (x) => (x.availability ? 'Available' : 'Unavailable') },
    ],
    [],
  );

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
                    <button type="button" className="compare-book" onClick={() => navigate(`/adventures/${adv.id}`)}>
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
                      <td key={`${row.key}-${adv.id}`} className={idx === winIdx ? 'cell-winner' : ''}>
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

