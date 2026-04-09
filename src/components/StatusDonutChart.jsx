import { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";

const STATUS_COLORS = {
  SUCCESS:    "#3B6D11",
  FAILED:     "#A32D2D",
  REFUNDED:   "#854F0B",
  CHARGEBACK: "#993556",
  PENDING:    "#5F5E5A",
};

export default function StatusDonutChart({ payments }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!payments.length) return;

    const counts = {};
    payments.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const data   = Object.values(counts);
    const colors = labels.map((l) => STATUS_COLORS[l] || "#888");
    const total  = data.reduce((a, b) => a + b, 0);

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                ` ${ctx.label}: ${ctx.raw} (${Math.round((ctx.raw / total) * 100)}%)`,
            },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [payments]);

  const counts = {};
  payments.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1; });
  const total = payments.length || 1;

  return (
    <div className="fin-card">
      <p className="chart-title">Payment status</p>
      <div className="chart-legend">
        {Object.entries(counts).map(([status, count]) => (
          <span key={status} className="legend-item">
            <span
              className="legend-dot"
              style={{ background: STATUS_COLORS[status], borderRadius: "50%" }}
            />
            {status} {Math.round((count / total) * 100)}%
          </span>
        ))}
      </div>
      <div style={{ position: "relative", height: 220 }}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Payment status donut chart"
        />
      </div>
    </div>
  );
}