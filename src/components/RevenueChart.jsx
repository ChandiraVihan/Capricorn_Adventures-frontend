import { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";

export default function RevenueChart({ payments }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!payments.length) return;

    const monthlyMap = {};
    payments
      .filter((p) => p.status === "SUCCESS")
      .forEach((p) => {
        const month = new Date(p.createdAt).toLocaleString("default", {
          month: "short",
          year: "2-digit",
        });
        monthlyMap[month] = (monthlyMap[month] || 0) + Number(p.amount);
      });

    const labels = Object.keys(monthlyMap);
    const data   = Object.values(monthlyMap);

    if (chartRef.current) chartRef.current.destroy();

    const isDark = matchMedia("(prefers-color-scheme: dark)").matches;
    const textColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)";
    const gridColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)";

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Revenue (LKR)",
            data,
            backgroundColor: "#3979C2",
            borderRadius: 5,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => " LKR " + ctx.raw.toLocaleString(),
            },
          },
        },
        scales: {
          x: {
            ticks: { color: textColor, font: { size: 11 } },
            grid: { color: gridColor },
            border: { display: false },
          },
          y: {
            ticks: {
              color: textColor,
              font: { size: 11 },
              callback: (v) => "LKR " + (v / 1000).toFixed(0) + "k",
            },
            grid: { color: gridColor },
            border: { display: false },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [payments]);

  return (
    <div className="fin-card">
      <p className="chart-title">Monthly revenue</p>
      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "#3979C2" }} />
          Revenue (LKR)
        </span>
      </div>
      <div style={{ position: "relative", height: 220 }}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Monthly revenue bar chart"
        />
      </div>
    </div>
  );
}