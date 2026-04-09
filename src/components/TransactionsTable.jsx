const STATUS_STYLES = {
  SUCCESS:    { bg: "#EAF3DE", color: "#3B6D11" },
  FAILED:     { bg: "#FCEBEB", color: "#A32D2D" },
  REFUNDED:   { bg: "#FAEEDA", color: "#854F0B" },
  CHARGEBACK: { bg: "#FBEAF0", color: "#993556" },
  PENDING:    { bg: "#F1EFE8", color: "#5F5E5A" },
};

export default function TransactionsTable({ payments, onRefund }) {
  if (!payments.length) {
    return (
      <div className="fin-card">
        <p className="chart-title">Recent transactions</p>
        <p className="empty-state">No transactions found for this period.</p>
      </div>
    );
  }

  return (
    <div className="fin-card">
      <p className="chart-title">Recent transactions</p>
      <div className="table-wrapper">
        <table className="fin-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Booking ref</th>
              <th>Amount (LKR)</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {payments.slice(0, 10).map((p) => {
              const style = STATUS_STYLES[p.status] || STATUS_STYLES.PENDING;
              return (
                <tr key={p.id}>
                  <td className="mono">{p.transactionId}</td>
                  <td>{p.booking?.referenceId || p.bookingReferenceId || "—"}</td>
                  <td className="amount">{Number(p.amount).toLocaleString()}</td>
                  <td>{p.gatewayMethod}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ background: style.bg, color: style.color }}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="date-cell">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    {p.status === "SUCCESS" && (
                      <button
                        className="refund-btn"
                        onClick={() => onRefund(p.id)}
                      >
                        Mark refunded
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}