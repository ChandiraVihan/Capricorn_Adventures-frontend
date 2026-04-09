import { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";

export default function DailySparkline({ payments }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!payments.length) return;

    const dailyMap = {};
    payments.forEach((p) => {
      const day = p.createdAt?.slice(0, 10);
      if (day) dailyMap[day] = (dailyMap[day] || 0) + 1;
    });

    const last30 = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().slice(0, 10);
    });

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: last30.map((d) => d.slice(5)),
        datasets: [{
          data: last30.map((d) => dailyMap[d] || 0),
          borderColor: "#185FA5",
          backgroundColor: "rgba(24,95,165,0.08)",
          fill: true, tension: 0.4, pointRadius: 0, borderWidth: 1.5,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} transactions` } },
        },
        scales: { x: { display: false }, y: { display: false } },
      },
    });

    return () => chartRef.current?.destroy();
  }, [payments]);

  return (
    <div className="fin-card">
      <p className="chart-title" style={{ marginBottom: 4 }}>Daily transaction volume</p>
      <p className="chart-sub">Last 30 days</p>
      <div style={{ position: "relative", height: 100 }}>
        <canvas ref={canvasRef} role="img" aria-label="Daily transaction sparkline" />
      </div>
    </div>
  );
}