import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { exportFinancePnl, getFinancePnl } from './api/adminDashboardService';
import EmptyState from './components/admin/EmptyState';
import ErrorState from './components/admin/ErrorState';
import LoadingSkeleton from './components/admin/LoadingSkeleton';
import './components/admin/AdminDashboardShared.css';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const metricKeys = [
  'revenue',
  'costOfSales',
  'grossMargin',
  'netProfitPreTax',
  'netProfitPostTax',
];

const currencyFormatter = new Intl.NumberFormat('en-LK', {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

function formatCurrency(value) {
  return `LKR ${currencyFormatter.format(Number(value || 0))}`;
}

function formatNumber(value) {
  return decimalFormatter.format(Number(value || 0));
}

function toTitleCase(input) {
  return String(input || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function OwnerFinanceDashboard() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [selectedTaxRate, setSelectedTaxRate] = useState('');

  const loadPnl = async (selectedMonth) => {
    try {
      setError(null);
      setLoading(true);
      const response = await getFinancePnl(selectedMonth);
      setData(response);
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPnl(month);
  }, [month]);

  useEffect(() => {
    if (!data?.taxSummary) {
      setSelectedTaxRate('');
      return;
    }
    setSelectedTaxRate(String(data.taxSummary.taxRatePercent ?? 0));
  }, [data]);

  const handleExport = async () => {
    try {
      setDownloading(true);
      const file = await exportFinancePnl(month);
      const href = URL.createObjectURL(file);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = `capricorn-pnl-${month}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(href);
    } catch (err) {
      setError(err);
    } finally {
      setDownloading(false);
    }
  };

  const metricCards = useMemo(() => {
    if (!data) return [];
    return metricKeys.map((key) => ({
      key,
      ...data[key],
    }));
  }, [data]);

  const breakdownData = useMemo(() => {
    if (!data?.productBreakdown) return [];
    return [
      { name: 'Hotel', value: data.productBreakdown.hotelRevenue, color: '#4c6fff' },
      { name: 'Adventure', value: data.productBreakdown.adventureRevenue, color: '#56b6ff' },
      { name: 'Third-Party Commission', value: data.productBreakdown.thirdPartyCommission, color: '#8cc3ff' },
    ];
  }, [data?.productBreakdown]);

  const lineItemsByCategory = useMemo(() => {
    if (!data?.lineItems?.length) return [];
    const summary = data.lineItems.reduce((acc, item) => {
      const prior = acc[item.category] || 0;
      acc[item.category] = prior + Number(item.amount || 0);
      return acc;
    }, {});

    return Object.entries(summary).map(([category, amount]) => ({
      category,
      amount,
    }));
  }, [data?.lineItems]);

  const preTaxProfit = Number(data?.taxSummary?.netProfitPreTax ?? data?.netProfitPreTax?.actual ?? 0);
  const effectiveTaxRate = Number(selectedTaxRate || 0);
  const computedTaxAmount = (preTaxProfit * effectiveTaxRate) / 100;
  const computedPostTaxProfit = preTaxProfit - computedTaxAmount;

  const totalRevenue = Number(data?.revenue?.actual ?? 0);
  const totalCost = Number(data?.costOfSales?.actual ?? 0);
  const grossMarginPercent = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

  const tooltipFormatter = (value) => [formatCurrency(value), 'Amount'];

  return (
    <div className="admin-shell owner-finance-shell">
      <main className="admin-page">
        <header className="page-header owner-page-header">
          <div>
            <h1>Owner Profit &amp; Loss Dashboard</h1>
            <p>Month: {data?.month || month} {data?.monthToDate ? '(Month-to-date)' : ''}</p>
          </div>
          <div className="inline-controls">
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              aria-label="Select month"
            />
            <button className="action-btn" type="button" disabled={downloading} onClick={handleExport}>
              {downloading ? 'Exporting...' : 'Export XLSX'}
            </button>
          </div>
        </header>

        {loading ? <LoadingSkeleton rows={8} /> : null}

        {!loading && error ? (
          <ErrorState
            title={error.status === 401 || error.status === 403 ? 'Unauthorized' : 'Failed to load P&L'}
            message={error.message}
            onRetry={() => loadPnl(month)}
          />
        ) : null}

        {!loading && !error && !data ? (
          <EmptyState title="No finance data" description="No P&L data returned for this month." />
        ) : null}

        {!loading && !error && data ? (
          <>
            <section className="owner-finance-hero panel">
              <div>
                <p className="owner-finance-hero-label">Live Profit Calculator</p>
                <h2 className="owner-finance-hero-value">{formatCurrency(computedPostTaxProfit)}</h2>
                <p className="owner-finance-hero-subtitle">
                  Post-tax profit using {formatNumber(effectiveTaxRate)}% tax rate
                </p>
              </div>
              <div className="owner-tax-control">
                <label htmlFor="taxRate" className="owner-tax-label">Tax Rate (%)</label>
                <input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={selectedTaxRate}
                  onChange={(event) => setSelectedTaxRate(event.target.value)}
                  className="owner-tax-input"
                />
              </div>
            </section>

            <section className="owner-kpi-grid">
              {metricCards.map((metric) => (
                <article key={metric.key} className={`owner-kpi-card owner-kpi-${metric.varianceColor === 'green' ? 'up' : 'down'}`}>
                  <p className="owner-kpi-title">{toTitleCase(metric.title)}</p>
                  <p className="owner-kpi-value">{formatCurrency(metric.actual)}</p>
                  <p className="owner-kpi-meta">Budget {formatCurrency(metric.budget)}</p>
                  <p className="owner-kpi-meta">Variance {formatCurrency(metric.variance)} · MoM {formatNumber(metric.monthOverMonthChangePercent)}%</p>
                </article>
              ))}
            </section>

            <section className="owner-summary-strip panel">
              <article>
                <p className="owner-summary-label">Total Revenue</p>
                <h3>{formatCurrency(totalRevenue)}</h3>
              </article>
              <article>
                <p className="owner-summary-label">Total Cost</p>
                <h3>{formatCurrency(totalCost)}</h3>
              </article>
              <article>
                <p className="owner-summary-label">Gross Margin</p>
                <h3>{formatNumber(grossMarginPercent)}%</h3>
              </article>
            </section>

            <section className="layout-grid">
              <article className="panel">
                <h2 className="panel-title">Product Breakdown</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={breakdownData} dataKey="value" nameKey="name" outerRadius={100} label>
                      {breakdownData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={tooltipFormatter} />
                  </PieChart>
                </ResponsiveContainer>
              </article>

              <article className="panel">
                <h2 className="panel-title">Tax Summary</h2>
                <div className="kv">
                  <div className="kv-item">
                    <p className="kv-label">Tax Rate</p>
                    <p className="kv-value">{formatNumber(effectiveTaxRate)}%</p>
                  </div>
                  <div className="kv-item">
                    <p className="kv-label">Tax Amount</p>
                    <p className="kv-value">{formatCurrency(computedTaxAmount)}</p>
                  </div>
                  <div className="kv-item">
                    <p className="kv-label">Net Profit (Pre-Tax)</p>
                    <p className="kv-value">{formatCurrency(preTaxProfit)}</p>
                  </div>
                  <div className="kv-item">
                    <p className="kv-label">Net Profit (Post-Tax)</p>
                    <p className="kv-value">{formatCurrency(computedPostTaxProfit)}</p>
                  </div>
                </div>
                <p className="owner-tax-note">
                  This is a live UI calculation for preview. Export/API values remain based on backend calculations.
                </p>
              </article>
            </section>

            <section className="panel">
              <h2 className="panel-title">Line Items by Category</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={lineItemsByCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ecfb" />
                  <XAxis dataKey="category" tick={{ fill: '#5f6f86', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#5f6f86', fontSize: 12 }} />
                  <Tooltip formatter={tooltipFormatter} />
                  <Bar dataKey="amount" fill="#4c6fff" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
