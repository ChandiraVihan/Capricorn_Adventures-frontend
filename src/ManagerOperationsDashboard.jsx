import { Link, Navigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getManagerOperationsDashboard,
  getManagerRoomPurchases,
  getRoomServiceDashboard,
  getRoomServiceDailySummary,
  getShiftOverview,
} from './api/adminDashboardService';
import DataTable from './components/admin/DataTable';
import EmptyState from './components/admin/EmptyState';
import ErrorState from './components/admin/ErrorState';
import LoadingSkeleton from './components/admin/LoadingSkeleton';
import PriorityBadge from './components/admin/PriorityBadge';
import StatusBadge from './components/admin/StatusBadge';
import ShiftOverviewWidget from './components/admin/ShiftOverviewWidget';
import { useAuth } from './context/AuthContext';
import './components/admin/AdminDashboardShared.css';

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function getPaymentBadgeClass(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'SUCCESS') return 'badge-success';
  if (normalized === 'FAILED' || normalized === 'CHARGEBACK') return 'badge-danger';
  if (normalized === 'REFUNDED') return 'badge-warning';
  return 'badge-neutral';
}

function formatRoomLabel(row) {
  const roomName = String(row?.roomName || '').trim();
  const roomNumber = Number.isFinite(Number(row?.roomNumber)) ? `#${Number(row.roomNumber)}` : '';
  if (roomName && roomNumber) return `${roomName} (${roomNumber})`;
  if (roomName) return roomName;
  if (roomNumber) return roomNumber;
  return '-';
}

const GUIDE_ASSIGNMENTS_STORAGE_KEY = 'capricorn.managerOperations.guideAssignments';

function readGuideAssignments() {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(GUIDE_ASSIGNMENTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeGuideAssignments(assignments) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(GUIDE_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments || {}));
}

function applyGuideAssignments(tours, assignments) {
  if (!Array.isArray(tours) || !tours.length) return tours;

  return tours.map((tour) => {
    const assignment = assignments?.[String(tour.scheduleId)] || assignments?.[tour.scheduleId];
    if (!assignment) return tour;

    return {
      ...tour,
      assignedGuideName: assignment.staffName || tour.assignedGuideName || 'Assigned locally',
      guideAssigned: true,
      guideAssignmentRequired: false,
      quickActionLabel: `Assigned to ${assignment.staffName || 'guide'}`,
    };
  });
}

function MiniSparkline({ values = [], tone = 'blue' }) {
  const normalized = (Array.isArray(values) ? values : []).map((value) => Number(value) || 0);
  const source = normalized.length ? normalized : [0, 0, 0, 0, 0];
  const width = 112;
  const height = 32;
  const min = Math.min(...source);
  const max = Math.max(...source);
  const range = max - min || 1;

  const points = source
    .map((value, index) => {
      const x = (index / Math.max(source.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="metric-sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Metric trend sparkline">
      <polyline className={`metric-sparkline-line metric-sparkline-line-${tone}`} fill="none" points={points} />
    </svg>
  );
}

export default function ManagerOperationsDashboard() {
  const { user, hasAnyRole } = useAuth();

  // Protect this component: only allow users with the MANAGER role
  if (!user || !hasAnyRole('MANAGER')) {
    return <Navigate to="/home" replace />;
  }
  const [activeSection, setActiveSection] = useState('overview');
  const [data, setData] = useState(null);
  const [roomPurchases, setRoomPurchases] = useState([]);
  const [shiftOverview, setShiftOverview] = useState(null);
  const [roomServiceDashboard, setRoomServiceDashboard] = useState(null);
  const [roomServiceSummary, setRoomServiceSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomPurchasesLoading, setRoomPurchasesLoading] = useState(true);
  const [shiftOverviewLoading, setShiftOverviewLoading] = useState(true);
  const [roomServiceLoading, setRoomServiceLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomPurchasesError, setRoomPurchasesError] = useState(null);
  const [roomServiceError, setRoomServiceError] = useState(null);
  const [assignModalTour, setAssignModalTour] = useState(null);
  const [selectedGuideId, setSelectedGuideId] = useState('');
  const [assignGuideSaving, setAssignGuideSaving] = useState(false);
  const [assignGuideError, setAssignGuideError] = useState('');
  const [guideAssignments, setGuideAssignments] = useState(() => readGuideAssignments());

  useEffect(() => {
    writeGuideAssignments(guideAssignments);
  }, [guideAssignments]);

  const loadDashboard = async () => {
    setError(null);
    setRoomPurchasesError(null);
    setRoomServiceError(null);
    setLoading(true);
    setRoomPurchasesLoading(true);
    setShiftOverviewLoading(true);
    setRoomServiceLoading(true);

    const [dashboardResult, roomPurchasesResult, shiftOverviewResult, roomServiceDashboardResult, roomServiceSummaryResult] = await Promise.allSettled([
      getManagerOperationsDashboard(),
      getManagerRoomPurchases({
        limit: 25,
        statuses: ['SUCCESS', 'PENDING', 'REFUNDED'],
      }),
      getShiftOverview(),
      getRoomServiceDashboard(),
      getRoomServiceDailySummary(),
    ]);

    if (dashboardResult.status === 'fulfilled') {
      setData(applyGuideAssignments(dashboardResult.value, guideAssignments));
    } else {
      setError(dashboardResult.reason);
      setData(null);
    }

    if (roomPurchasesResult.status === 'fulfilled') {
      setRoomPurchases(Array.isArray(roomPurchasesResult.value) ? roomPurchasesResult.value : []);
    } else {
      setRoomPurchasesError(roomPurchasesResult.reason);
      setRoomPurchases([]);
    }

    if (shiftOverviewResult.status === 'fulfilled') {
      setShiftOverview(shiftOverviewResult.value?.data ?? shiftOverviewResult.value?.payload ?? shiftOverviewResult.value ?? null);
    } else {
      setShiftOverview(null);
    }

    if (roomServiceDashboardResult.status === 'fulfilled') {
      setRoomServiceDashboard(
        roomServiceDashboardResult.value?.data ??
        roomServiceDashboardResult.value?.payload ??
        roomServiceDashboardResult.value ??
        null,
      );
    } else {
      setRoomServiceDashboard(null);
      setRoomServiceError(roomServiceDashboardResult.reason);
    }

    if (roomServiceSummaryResult.status === 'fulfilled') {
      setRoomServiceSummary(
        roomServiceSummaryResult.value?.data ??
        roomServiceSummaryResult.value?.payload ??
        roomServiceSummaryResult.value ??
        null,
      );
    } else if (!roomServiceError) {
      setRoomServiceError(roomServiceSummaryResult.reason);
    }

    setLoading(false);
    setRoomPurchasesLoading(false);
    setShiftOverviewLoading(false);
    setRoomServiceLoading(false);
  };

  useEffect(() => {
    let timer = null;

    const run = async () => {
      await loadDashboard();
    };

    run();

    if (data?.autoRefreshEnabled && data?.refreshIntervalSeconds) {
      timer = window.setInterval(run, data.refreshIntervalSeconds * 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [data?.autoRefreshEnabled, data?.refreshIntervalSeconds, guideAssignments]);

  const issuesBySchedule = useMemo(() => {
    const map = new Map();
    (data?.issues || []).forEach((issue) => {
      if (!map.has(issue.scheduleId)) {
        map.set(issue.scheduleId, []);
      }
      map.get(issue.scheduleId).push(issue);
    });
    return map;
  }, [data?.issues]);

  const guideOptions = useMemo(() => {
    const staff = [];
    (shiftOverview?.departments || []).forEach((department) => {
      (department.onShiftStaff || []).forEach((item) => {
        if (!item?.staffId) return;
        staff.push({
          shiftId: item.shiftId ?? null,
          staffId: String(item.staffId),
          staffName: String(item.staffName || 'Unknown staff'),
          departmentName: String(department.departmentName || department.departmentCode || 'Team'),
          currentTaskAssignment: item.currentTaskAssignment || null,
        });
      });
    });

    return staff;
  }, [shiftOverview?.departments]);

  const sectionStats = useMemo(() => {
    const totalTours = data?.todayTours?.length || 0;
    const assignedTours = (data?.todayTours || []).filter((tour) => tour.assignedGuideName).length;
    const unassignedTours = Math.max(totalTours - assignedTours, 0);
    const roomPurchaseCount = roomPurchases.length;
    const activeRoomOrders = roomServiceDashboard?.activeOrders?.length || 0;

    return {
      totalTours,
      assignedTours,
      unassignedTours,
      roomPurchaseCount,
      activeRoomOrders,
    };
  }, [data?.todayTours, roomPurchases.length, roomServiceDashboard?.activeOrders?.length]);

  const todayTours = useMemo(() => data?.todayTours || [], [data?.todayTours]);
  const assignedTours = useMemo(() => todayTours.filter((tour) => tour.assignedGuideName), [todayTours]);
  const unassignedTours = useMemo(() => todayTours.filter((tour) => !tour.assignedGuideName), [todayTours]);

  const dailyToursChartData = useMemo(() => {
    if (Array.isArray(data?.weeklyOccupancy) && data.weeklyOccupancy.length) {
      return data.weeklyOccupancy.map((item) => ({
        label: item.dayLabel || '-',
        booked: Number(item.bookedCapacity) || 0,
        available: Number(item.availableCapacity) || 0,
      }));
    }

    return todayTours.slice(0, 8).map((tour, index) => ({
      label: `Tour ${index + 1}`,
      booked: Number(tour.checkedInCustomerCount) || 0,
      available: Math.max((Number(tour.totalCapacity) || 0) - (Number(tour.checkedInCustomerCount) || 0), 0),
    }));
  }, [data?.weeklyOccupancy, todayTours]);

  const kpiSparklineSeries = useMemo(() => {
    const occupancyTrend = (data?.weeklyOccupancy || []).map((item) => Number(item.bookedCapacity) || 0);

    const purchaseByDay = roomPurchases.reduce((acc, row) => {
      const key = String(row?.purchasedAt || '').slice(0, 10);
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const purchaseTrend = Object.entries(purchaseByDay)
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(-7)
      .map(([, count]) => count);

    return {
      tours: occupancyTrend.length ? occupancyTrend : [2, 3, 4, 3, 5, 4, 6],
      assigned: [
        Math.max(sectionStats.assignedTours - 2, 0),
        Math.max(sectionStats.assignedTours - 1, 0),
        sectionStats.assignedTours,
        sectionStats.assignedTours + 1,
      ],
      unassigned: [
        sectionStats.unassignedTours + 2,
        sectionStats.unassignedTours + 1,
        sectionStats.unassignedTours,
      ],
      purchases: purchaseTrend.length ? purchaseTrend : [1, 2, 3, 2, 4, 3, 5],
      roomService: [
        Math.max(sectionStats.activeRoomOrders - 2, 0),
        Math.max(sectionStats.activeRoomOrders - 1, 0),
        sectionStats.activeRoomOrders,
      ],
    };
  }, [data?.weeklyOccupancy, roomPurchases, sectionStats.activeRoomOrders, sectionStats.assignedTours, sectionStats.unassignedTours]);

  const kpiCards = [
    {
      key: 'tours',
      title: 'Tours',
      value: sectionStats.totalTours,
      subtitle: 'Today\'s scheduled departures',
      tone: 'blue',
      className: 'metric-card-success',
      series: kpiSparklineSeries.tours,
    },
    {
      key: 'assigned',
      title: 'Assigned',
      value: sectionStats.assignedTours,
      subtitle: 'Tours with confirmed guides',
      tone: 'green',
      className: '',
      series: kpiSparklineSeries.assigned,
    },
    {
      key: 'needs-guide',
      title: 'Needs Guide',
      value: sectionStats.unassignedTours,
      subtitle: 'Pending guide assignment',
      tone: 'amber',
      className: 'metric-card-danger',
      series: kpiSparklineSeries.unassigned,
    },
    {
      key: 'purchases',
      title: 'Room Purchases',
      value: sectionStats.roomPurchaseCount,
      subtitle: 'Recent purchase events',
      tone: 'blue',
      className: '',
      series: kpiSparklineSeries.purchases,
    },
    {
      key: 'room-service',
      title: 'Room Service',
      value: sectionStats.activeRoomOrders,
      subtitle: 'Active service orders',
      tone: 'green',
      className: '',
      series: kpiSparklineSeries.roomService,
    },
  ];

  const availableGuideOptions = useMemo(() => {
    const uniqueByStaffId = new Map();

    guideOptions.forEach((item) => {
      if (!item.staffId || uniqueByStaffId.has(item.staffId)) return;
      uniqueByStaffId.set(item.staffId, item);
    });

    return Array.from(uniqueByStaffId.values());
  }, [guideOptions]);

  const closeAssignModal = () => {
    setAssignModalTour(null);
    setSelectedGuideId('');
    setAssignGuideError('');
    setAssignGuideSaving(false);
  };

  const openAssignModal = (tour) => {
    setAssignModalTour(tour);
    setAssignGuideError('');
    setSelectedGuideId(availableGuideOptions[0]?.staffId || '');
  };

  const handleAssignGuide = async (event) => {
    event.preventDefault();
    if (!assignModalTour || !selectedGuideId) {
      setAssignGuideError('Select a guide to continue.');
      return;
    }

    setAssignGuideSaving(true);
    setAssignGuideError('');

    try {
      const selectedGuide = availableGuideOptions.find((item) => item.staffId === selectedGuideId);
      const assignmentRecord = {
        staffId: selectedGuideId,
        staffName: selectedGuide?.staffName || 'Assigned Guide',
        departmentName: selectedGuide?.departmentName || 'Team',
        shiftId: selectedGuide?.shiftId ?? null,
        assignedAt: new Date().toISOString(),
      };

      setGuideAssignments((current) => {
        const nextAssignments = {
          ...current,
          [String(assignModalTour.scheduleId)]: assignmentRecord,
        };
        writeGuideAssignments(nextAssignments);
        return nextAssignments;
      });

      setData((current) => {
        if (!current?.todayTours?.length) return current;
        return {
          ...current,
          todayTours: current.todayTours.map((tour) =>
            Number(tour.scheduleId) === Number(assignModalTour.scheduleId)
              ? {
                  ...tour,
                  assignedGuideName: assignmentRecord.staffName,
                  guideAssigned: true,
                  guideAssignmentRequired: false,
                  quickActionLabel: `Assigned to ${assignmentRecord.staffName}`,
                }
              : tour,
          ),
        };
      });

      closeAssignModal();
    } catch (err) {
      setAssignGuideError(err.message || 'Unable to assign guide.');
    } finally {
      setAssignGuideSaving(false);
    }
  };

  const columns = [
    { key: 'adventureName', header: 'Tour' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'assignedGuideName',
      header: 'Guide',
      render: (row) => row.assignedGuideName || 'Unassigned',
    },
    {
      key: 'capacity',
      header: 'Capacity',
      render: (row) => `${row.checkedInCustomerCount} checked-in / ${row.totalCapacity}`,
    },
    {
      key: 'issues',
      header: 'Issues',
      render: (row) => {
        const issues = issuesBySchedule.get(row.scheduleId) || [];
        if (!issues.length) return 'None';
        return (
          <div className="list">
            {issues.map((issue) => (
              <div key={issue.alertId}>
                <PriorityBadge priority={issue.priority} />
                <p>{issue.title}</p>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="stack">
          <button className="action-btn" type="button" onClick={() => openAssignModal(row)}>
            {row.assignedGuideName ? 'Change Guide' : 'Assign Guide'}
          </button>
          <span className="metric-card-subtitle">
            {row.assignedGuideName ? `Current guide: ${row.assignedGuideName}` : row.quickActionLabel || 'No guide assigned'}
          </span>
        </div>
      ),
    },
  ];

  const roomPurchaseColumns = [
    {
      key: 'purchasedAt',
      header: 'Purchased At',
      render: (row) => formatDateTime(row.purchasedAt),
    },
    {
      key: 'guestName',
      header: 'Purchased By',
      render: (row) => row.guestName || '-',
    },
    {
      key: 'roomName',
      header: 'Room',
      render: (row) => formatRoomLabel(row),
    },
    {
      key: 'bookingReferenceId',
      header: 'Booking Ref',
      render: (row) => row.bookingReferenceId || '-',
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => `${row.currency || 'LKR'} ${Number(row.amount || 0).toLocaleString()}`,
    },
    {
      key: 'status',
      header: 'Payment',
      render: (row) => <span className={`badge ${getPaymentBadgeClass(row.status)}`}>{row.status || 'PENDING'}</span>,
    },
  ];

  const guideAssignmentColumns = [
    { key: 'adventureName', header: 'Tour' },
    {
      key: 'guide',
      header: 'Current Guide',
      render: (row) => row.assignedGuideName || 'Unassigned',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Assignment',
      render: (row) => (
        <div className="stack">
          <button className="action-btn" type="button" onClick={() => openAssignModal(row)}>
            {row.assignedGuideName ? 'Change Guide' : 'Assign Guide'}
          </button>
          <span className="metric-card-subtitle">
            {row.guideAssignmentRequired ? 'Assignment required' : 'Manage guide locally'}
          </span>
        </div>
      ),
    },
  ];

  const roomServiceColumns = [
    {
      key: 'orderId',
      header: 'Order',
      render: (row) => `#${row.orderId}`,
    },
    {
      key: 'roomNumber',
      header: 'Room',
      render: (row) => `Room ${row.roomNumber}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'assignedStaffName',
      header: 'Assigned Staff',
      render: (row) => row.assignedStaffName || 'Unassigned',
    },
  ];

  const navigationItems = [
    { key: 'overview', label: 'Overview' },
    { key: 'tours', label: 'Tours' },
    { key: 'guide-assignment', label: 'Guide Assignment' },
    { key: 'room-purchases', label: 'Room Purchases' },
    { key: 'room-service', label: 'Room Service' },
  ];

  const renderSectionHeader = (title, subtitle) => (
    <div className="page-header section-header">
      <div>
        <h2 className="panel-title">{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    </div>
  );

  return (
    <div className="admin-shell manager-shell">
      <aside className="manager-sidebar">
        <div className="manager-sidebar-brand">
          <h1>Capricorn</h1>
          <p>Manager Operations</p>
        </div>

        <nav className="manager-nav" aria-label="Manager sections">
          {navigationItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`manager-nav-item ${activeSection === item.key ? 'manager-nav-item-active' : ''}`}
              onClick={() => setActiveSection(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="manager-sidebar-card">
          <p className="metric-card-title">Room Service</p>
          <p className="manager-sidebar-note">Open the dedicated room service console when needed.</p>
          <Link className="action-btn manager-nav-link" to="/manager/room-service">
            Open Room Service
          </Link>
        </div>
      </aside>

      <main className="admin-page manager-content">
        <header className="page-header manager-header">
          <div>
            <h1>Manager Operations</h1>
            <p>Business Date: {data?.businessDate || '-'} · Last generated: {formatDateTime(data?.generatedAt)}</p>
          </div>
          <button className="secondary-btn action-btn" type="button" onClick={loadDashboard}>
            Refresh
          </button>
        </header>

        <section className="panel manager-summary-panel">
          <div className="metric-grid manager-summary-grid">
            {kpiCards.map((card) => (
              <article key={card.key} className={`metric-card manager-kpi-card ${card.className}`.trim()}>
                <div className="manager-kpi-top-row">
                  <p className="metric-card-title">{card.title}</p>
                </div>
                <p className="metric-card-value">{card.value}</p>
                <p className="metric-card-subtitle">{card.subtitle}</p>
                <MiniSparkline values={card.series} tone={card.tone} />
              </article>
            ))}
          </div>
        </section>

        {loading ? <LoadingSkeleton rows={6} /> : null}

        {!loading && error ? (
          <ErrorState
            title={error.status === 403 ? 'Access denied' : 'Unable to load manager dashboard'}
            message={error.message}
            onRetry={loadDashboard}
          />
        ) : null}

        {!loading && !error && activeSection === 'overview' ? (
          <section className="panel manager-overview-panel">
            {renderSectionHeader('Overview', 'Daily performance snapshot with tours volume and latest room purchase activity.')}
            <div className="manager-overview-layout">
              <article className="panel nested-panel manager-chart-panel">
                <div className="manager-chart-header">
                  <h3 className="panel-title">Daily Tours</h3>
                  <p>Booked versus available capacity trend.</p>
                </div>
                {dailyToursChartData.length ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyToursChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(35, 73, 126, 0.12)" vertical={false} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#5f7290', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#5f7290', fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: 'rgba(31, 111, 216, 0.07)' }}
                        contentStyle={{ borderRadius: 12, borderColor: 'rgba(29, 62, 115, 0.15)' }}
                      />
                      <Legend />
                      <Bar dataKey="booked" name="Booked" fill="#1f6fd8" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="available" name="Available" fill="#11a36f" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState title="No tour trend data" description="No occupancy or tour trend values were returned." />
                )}
              </article>

              <article className="panel nested-panel manager-table-panel">
                <div className="manager-chart-header">
                  <h3 className="panel-title">Guide Assignment</h3>
                  <p>Current guide assignments for today.</p>
                </div>
                {!assignedTours.length && !unassignedTours.length ? (
                  <EmptyState title="No tours available" description="There are no tours to assign right now." />
                ) : (
                  <DataTable columns={guideAssignmentColumns} rows={todayTours.slice(0, 5)} rowClassName={(row) => (row.guideAssignmentRequired ? 'row-alert' : '')} />
                )}
              </article>
            </div>

            <div style={{ marginTop: '12px' }}>
              <article className="panel nested-panel">
                <div className="manager-chart-header">
                  <h3 className="panel-title">Recent Room Purchases</h3>
                  <p>Latest customer purchases and payment status.</p>
                </div>

                {roomPurchasesLoading ? <LoadingSkeleton rows={5} /> : null}
                {!roomPurchasesLoading && roomPurchasesError ? (
                  <ErrorState title="Unable to load purchases" message={roomPurchasesError.message} onRetry={loadDashboard} />
                ) : null}
                {!roomPurchasesLoading && !roomPurchasesError && !roomPurchases.length ? (
                  <EmptyState title="No purchase records" description="No room purchases were returned for this period." />
                ) : null}
                {!roomPurchasesLoading && !roomPurchasesError && roomPurchases.length ? (
                  <div className="manager-mini-table-wrap">
                    <table className="manager-mini-table">
                      <thead>
                        <tr>
                          <th>Guest</th>
                          <th>Room</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Purchased</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roomPurchases.slice(0, 7).map((row) => (
                          <tr key={`${row.purchaseId || row.bookingReferenceId || row.purchasedAt}-${row.roomNumber || row.roomName || 'room'}`}>
                            <td>{row.guestName || '-'}</td>
                            <td>{formatRoomLabel(row)}</td>
                            <td>{`${row.currency || 'LKR'} ${Number(row.amount || 0).toLocaleString()}`}</td>
                            <td><span className={`badge ${getPaymentBadgeClass(row.status)}`}>{row.status || 'PENDING'}</span></td>
                            <td>{formatDateTime(row.purchasedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </article>
            </div>
          </section>
        ) : null}

        {!loading && !error && activeSection === 'tours' ? (
          <section className="panel manager-overview-panel">
            {renderSectionHeader('Today\'s Tours', 'Complete list of today\'s adventure schedules and assignments.')}
            <div className="manager-overview-layout" style={{ gridTemplateColumns: '1fr' }}>
              <article className="panel nested-panel">
                {!todayTours.length ? (
                  <EmptyState title="No tours for today" description="No tour schedules were returned for today." />
                ) : (
                  <DataTable columns={columns} rows={todayTours} rowClassName={(row) => (row.guideAssignmentRequired ? 'row-alert' : '')} />
                )}
              </article>
            </div>
          </section>
        ) : null}

        {!loading && !error && activeSection === 'guide-assignment' ? (
          <section className="panel manager-overview-panel">
            {renderSectionHeader('Guide Assignment', 'Manage and assign guides to tours from one central location.')}
            <div className="manager-overview-layout">
              <article className="panel nested-panel manager-chart-panel">
                <div className="manager-chart-header">
                  <h3 className="panel-title">Daily Tours</h3>
                  <p>Booked versus available capacity trend.</p>
                </div>
                {dailyToursChartData.length ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyToursChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(35, 73, 126, 0.12)" vertical={false} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#5f7290', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#5f7290', fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: 'rgba(31, 111, 216, 0.07)' }}
                        contentStyle={{ borderRadius: 12, borderColor: 'rgba(29, 62, 115, 0.15)' }}
                      />
                      <Legend />
                      <Bar dataKey="booked" name="Booked" fill="#1f6fd8" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="available" name="Available" fill="#11a36f" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState title="No tour trend data" description="No occupancy or tour trend values were returned." />
                )}
              </article>

              <article className="panel nested-panel manager-table-panel">
                <div className="manager-chart-header">
                  <h3 className="panel-title">Guide Assignments</h3>
                  <p>Today's tours and guide assignments.</p>
                </div>
                {!assignedTours.length && !unassignedTours.length ? (
                  <EmptyState title="No tours available" description="There are no tours to assign right now." />
                ) : (
                  <DataTable columns={guideAssignmentColumns} rows={todayTours} rowClassName={(row) => (row.guideAssignmentRequired ? 'row-alert' : '')} />
                )}
              </article>
            </div>
          </section>
        ) : null}

        {!loading && !error && activeSection === 'room-purchases' ? (
          <section className="panel manager-overview-panel">
            {renderSectionHeader('Room Purchases', 'Track all customer room purchases and payment transaction history.')}
            <div className="manager-overview-layout">
              <article className="panel nested-panel manager-chart-panel">
                <div className="manager-chart-header">
                  <h3 className="panel-title">Daily Tours</h3>
                  <p>Booked versus available capacity trend.</p>
                </div>
                {dailyToursChartData.length ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyToursChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(35, 73, 126, 0.12)" vertical={false} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#5f7290', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#5f7290', fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: 'rgba(31, 111, 216, 0.07)' }}
                        contentStyle={{ borderRadius: 12, borderColor: 'rgba(29, 62, 115, 0.15)' }}
                      />
                      <Legend />
                      <Bar dataKey="booked" name="Booked" fill="#1f6fd8" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="available" name="Available" fill="#11a36f" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState title="No tour trend data" description="No occupancy or tour trend values were returned." />
                )}
              </article>

              <article className="panel nested-panel manager-table-panel">
                <div className="manager-chart-header">
                  <h3 className="panel-title">Room Purchases</h3>
                  <p>Latest customer purchases and payment status.</p>
                </div>
                {roomPurchasesLoading ? <LoadingSkeleton rows={5} /> : null}
                {!roomPurchasesLoading && roomPurchasesError ? (
                  <ErrorState title="Unable to load room purchases" message={roomPurchasesError.message} onRetry={loadDashboard} />
                ) : null}
                {!roomPurchasesLoading && !roomPurchasesError && !roomPurchases.length ? (
                  <EmptyState title="No room purchases found" description="No room purchase records were returned for the selected period." />
                ) : null}
                {!roomPurchasesLoading && !roomPurchasesError && roomPurchases.length ? (
                  <DataTable columns={roomPurchaseColumns} rows={roomPurchases} />
                ) : null}
              </article>
            </div>
          </section>
        ) : null}

        {!loading && !error && activeSection === 'room-service' ? (
          <section className="panel manager-overview-panel">
            {renderSectionHeader('Room Service Orders', 'Monitor live room service operations and order status.')}
            <div className="manager-overview-layout">
              <article className="panel nested-panel manager-chart-panel">
                <div className="manager-chart-header">
                  <h3 className="panel-title">Daily Tours</h3>
                  <p>Booked versus available capacity trend.</p>
                </div>
                {dailyToursChartData.length ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyToursChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(35, 73, 126, 0.12)" vertical={false} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#5f7290', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#5f7290', fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: 'rgba(31, 111, 216, 0.07)' }}
                        contentStyle={{ borderRadius: 12, borderColor: 'rgba(29, 62, 115, 0.15)' }}
                      />
                      <Legend />
                      <Bar dataKey="booked" name="Booked" fill="#1f6fd8" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="available" name="Available" fill="#11a36f" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState title="No tour trend data" description="No occupancy or tour trend values were returned." />
                )}
              </article>

              <article className="panel nested-panel manager-table-panel">
                <div className="manager-chart-header">
                  <h3 className="panel-title">Room Service Orders</h3>
                  <p>Active service orders and status.</p>
                </div>
                {roomServiceLoading ? <LoadingSkeleton rows={4} /> : null}
                {!roomServiceLoading && roomServiceError ? (
                  <ErrorState title="Unable to load room service" message={roomServiceError.message} onRetry={loadDashboard} />
                ) : null}
                {!roomServiceLoading && !roomServiceError ? (
                  <div className="stack">
                    <div className="metric-grid manager-summary-grid">
                      <article className="metric-card">
                        <p className="metric-card-title">Active Orders</p>
                        <p className="metric-card-value">{roomServiceDashboard?.activeOrders?.length || 0}</p>
                      </article>
                      <article className="metric-card">
                        <p className="metric-card-title">Unresolved</p>
                        <p className="metric-card-value">{roomServiceSummary?.unresolvedOrdersCount || 0}</p>
                      </article>
                      <article className="metric-card">
                        <p className="metric-card-title">Avg. Delivery</p>
                        <p className="metric-card-value">{roomServiceSummary?.averageDeliveryMinutes ?? '-'} min</p>
                      </article>
                    </div>

                    {roomServiceDashboard?.activeOrders?.length ? (
                      <DataTable columns={roomServiceColumns} rows={roomServiceDashboard.activeOrders.slice(0, 6)} />
                    ) : (
                      <EmptyState title="No active room service orders" description="No live room service orders were returned for the current business date." />
                    )}

                    <div className="inline-controls">
                      <Link className="action-btn" to="/manager/room-service">
                        Open Full Room Service Console
                      </Link>
                    </div>
                  </div>
                ) : null}
              </article>
            </div>
          </section>
        ) : null}


        {assignModalTour ? (
          <div className="modal-backdrop" role="presentation" onClick={closeAssignModal}>
            <div className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="assign-guide-title" onClick={(event) => event.stopPropagation()}>
              <div className="page-header">
                <div>
                  <h2 id="assign-guide-title" className="panel-title">Assign Guide</h2>
                  <p>{assignModalTour.adventureName}</p>
                </div>
                <button className="secondary-btn action-btn" type="button" onClick={closeAssignModal}>
                  Close
                </button>
              </div>

              <div className="kv">
                <div className="kv-item">
                  <p className="kv-label">Tour</p>
                  <p className="kv-value">{assignModalTour.adventureName}</p>
                </div>
                <div className="kv-item">
                  <p className="kv-label">Schedule ID</p>
                  <p className="kv-value">{assignModalTour.scheduleId}</p>
                </div>
                <div className="kv-item">
                  <p className="kv-label">Current Guide</p>
                  <p className="kv-value">{assignModalTour.assignedGuideName || 'Unassigned'}</p>
                </div>
              </div>

              {shiftOverviewLoading ? <LoadingSkeleton rows={2} /> : null}

              {!shiftOverviewLoading && !availableGuideOptions.length ? (
                <EmptyState
                  title="No available guides"
                  description="No on-shift staff records were returned to assign as guides."
                />
              ) : null}

              {!shiftOverviewLoading && availableGuideOptions.length ? (
                <form className="stack" onSubmit={handleAssignGuide}>
                  <label className="stack" htmlFor="guide-select">
                    <span className="kv-label">Select Guide</span>
                    <select
                      id="guide-select"
                      className="modal-select"
                      value={selectedGuideId}
                      onChange={(event) => setSelectedGuideId(event.target.value)}
                    >
                      {availableGuideOptions.map((guide) => (
                        <option key={guide.staffId} value={guide.staffId}>
                          {guide.staffName} - {guide.departmentName}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedGuideId ? (
                    <div className="warning-note">
                      {availableGuideOptions.find((guide) => guide.staffId === selectedGuideId)?.currentTaskAssignment || 'Selected guide will be assigned locally to this adventure.'}
                    </div>
                  ) : null}

                  {assignGuideError ? <div className="error-banner">{assignGuideError}</div> : null}

                  <div className="inline-controls" style={{ justifyContent: 'flex-end' }}>
                    <button className="secondary-btn action-btn" type="button" onClick={closeAssignModal} disabled={assignGuideSaving}>
                      Cancel
                    </button>
                    <button className="action-btn" type="submit" disabled={assignGuideSaving || !selectedGuideId}>
                      {assignGuideSaving ? 'Assigning...' : 'Assign Guide'}
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
