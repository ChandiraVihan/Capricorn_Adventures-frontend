import { useState, useEffect, useMemo } from "react";
import { useFinanceData } from "./hooks/useFinanceData";
import KpiCard              from "./components/KpiCard";
import RevenueChart         from "./components/RevenueChart";
import StatusDonutChart     from "./components/StatusDonutChart";
import InvoiceTrendChart    from "./components/InvoiceTrendChart";
import MethodBarChart       from "./components/MethodBarChart";
import DailySparkline       from "./components/DailySparkline";
import TransactionsTable    from "./components/TransactionsTable";
import { syncPayments }     from "./api/financeApi";
import "./FinanceDashboard.css";

const RANGES = {
  "7":   { label: "Last 7 days",  days: 7  },
  "30":  { label: "Last 30 days", days: 30 },
  "90":  { label: "Last 90 days", days: 90 },
  "365": { label: "This year",    days: 365 },
};

function getDateRange(days) {
  const to   = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);

  // Use local time formatted as YYYY-MM-DDTHH:mm:ss for backend compatibility
  const formatLocal = (date) => {
    const offset = date.getTimezoneOffset() * 60000;
    const local = new Date(date.getTime() - offset);
    return local.toISOString().slice(0, 19);
  };

  return {
    from: formatLocal(from),
    to:   formatLocal(to),
  };
}

function computeKpis(payments, invoices) {
  const totalRevenue = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const successCount = payments.filter((p) => p.status === "SUCCESS").length;
  const successRate  = payments.length
    ? Math.round((successCount / payments.length) * 100)
    : 0;

  const totalRefunded = payments
    .filter((p) => p.status === "REFUNDED")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const activeInvoices = invoices.filter((inv) => inv.status === "ISSUED").length;

  return { totalRevenue, successRate, totalRefunded, activeInvoices };
}

export default function FinanceDashboard() {
  const [range, setRange]           = useState("30");
  const [statusFilter, setStatus]   = useState("all");
  const { payments, invoices, loading, error, fetchData, refundPayment } =
    useFinanceData();

  useEffect(() => {
    const { from, to } = getDateRange(RANGES[range].days);
    fetchData(from, to);
  }, [range, fetchData]);

  const handleRefund = async (paymentId) => {
    if (!window.confirm("Mark this payment as refunded?")) return;
    const { from, to } = getDateRange(RANGES[range].days);
    await refundPayment(paymentId, from, to);
  };

  const handleSync = async () => {
    try {
      const msg = await syncPayments();
      alert(msg);
      const { from, to } = getDateRange(RANGES[range].days);
      fetchData(from, to);
    } catch (err) {
      alert("Sync failed: " + err.message);
    }
  };

  const filteredPayments =
    statusFilter === "all"
      ? payments
      : payments.filter((p) => p.status === statusFilter);

  const { totalRevenue, successRate, totalRefunded, activeInvoices } =
    computeKpis(payments, invoices);

  const pulseMetrics = useMemo(() => {
    const pending = payments.filter((p) => p.status === "PENDING").length;
    const failed = payments.filter((p) => p.status === "FAILED").length;
    const completed = payments.filter((p) => p.status === "SUCCESS").length;

    return { pending, failed, completed };
  }, [payments]);

  return (
    <div className="fin-shell">
      <aside className="fin-sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">CA</span>
          <div>
            <p className="brand-title">Capricorn</p>
            <p className="brand-sub">Owner Console</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Finance navigation">
          <button className="sidebar-link is-active" type="button">Overview</button>
          <button className="sidebar-link" type="button">Revenue</button>
          <button className="sidebar-link" type="button">Invoices</button>
          <button className="sidebar-link" type="button">Transactions</button>
        </nav>

        <div className="sidebar-pulse">
          <p className="sidebar-card-title">Today snapshot</p>
          <div className="pulse-row">
            <span>Completed</span>
            <strong>{pulseMetrics.completed}</strong>
          </div>
          <div className="pulse-row">
            <span>Pending</span>
            <strong>{pulseMetrics.pending}</strong>
          </div>
          <div className="pulse-row">
            <span>Failed</span>
            <strong>{pulseMetrics.failed}</strong>
          </div>
        </div>

        <p className="sidebar-foot">Professional finance operations, tuned for speed.</p>
      </aside>

      <section className="fin-dashboard">
        <div className="dashboard-header">
          <div className="dashboard-title-group">
            <div>
              <h1 className="dashboard-title">Finance Dashboard</h1>
              <p className="dashboard-sub">Track revenue, invoices, and payment health in one place</p>
            </div>
            <button className="sync-btn" onClick={handleSync} title="Recover missing payments from webhook history">
              Sync Payments
            </button>
          </div>
          <div className="dashboard-actions">
            <label className="search-shell" htmlFor="finance-search">
              <input id="finance-search" type="text" placeholder="Search transactions, methods, refs" readOnly />
            </label>
            <div className="filter-bar">
              <select value={range} onChange={(e) => setRange(e.target.value)}>
                {Object.entries(RANGES).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
                <option value="CHARGEBACK">Chargeback</option>
              </select>
            </div>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading-state">Loading finance data...</div>
        ) : (
          <>
            <div className="kpi-grid">
              <KpiCard
                label="Total revenue"
                value={`LKR ${totalRevenue.toLocaleString()}`}
                sub="+12.4% vs last period"
                subType="up"
              />
              <KpiCard
                label="Transactions"
                value={payments.length}
                sub="payments recorded"
              />
              <KpiCard
                label="Success rate"
                value={`${successRate}%`}
                sub="of all transactions"
              />
              <KpiCard
                label="Invoices issued"
                value={activeInvoices}
                sub="active invoices"
              />
              <KpiCard
                label="Refunds"
                value={`LKR ${totalRefunded.toLocaleString()}`}
                sub="total refunded"
                subType="down"
              />
            </div>

            <div className="charts-row">
              <RevenueChart payments={payments} />
              <StatusDonutChart payments={payments} />
            </div>

            <div className="charts-row-equal">
              <InvoiceTrendChart invoices={invoices} />
              <MethodBarChart payments={payments} />
            </div>

            <DailySparkline payments={payments} />

            <TransactionsTable
              payments={filteredPayments}
              onRefund={handleRefund}
            />
          </>
        )}
      </section>
    </div>
  );
}