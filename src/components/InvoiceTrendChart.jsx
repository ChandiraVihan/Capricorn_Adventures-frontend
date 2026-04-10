import { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";

export default function InvoiceTrendChart({ invoices }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!invoices.length) return;

    const issuedMap = {};
    const voidedMap = {};

    invoices.forEach((inv) => {
      const month = new Date(inv.issuedAt).toLocaleString("default", {
        month: "short", year: "2-digit",
      });
      if (inv.status === "ISSUED") {
        issuedMap[month] = (issuedMap[month] || 0) + 1;
      } else if (inv.status === "VOID") {
        voidedMap[month] = (voidedMap[month] || 0) + 1;
      }
    });

    const labels = [...new Set([...Object.keys(issuedMap), ...Object.keys(voidedMap)])].sort();

    if (chartRef.current) chartRef.current.destroy();

    const isDark    = matchMedia("(prefers-color-scheme: dark)").matches;
    const textColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)";
    const gridColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)";

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Issued",
            data: labels.map((m) => issuedMap[m] || 0),
            borderColor: "#0F6E56",
            backgroundColor: "rgba(15,110,86,0.08)",
            fill: true, tension: 0.4, pointRadius: 3,
          },
          {
            label: "Voided",
            data: labels.map((m) => voidedMap[m] || 0),
            borderColor: "#993556",
            backgroundColor: "rgba(153,53,86,0.08)",
            fill: true, tension: 0.4, pointRadius: 3,
            borderDash: [4, 4],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: textColor, font: { size: 11 } }, grid: { color: gridColor }, border: { display: false } },
          y: { ticks: { color: textColor, font: { size: 11 }, stepSize: 1 }, grid: { color: gridColor }, border: { display: false } },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [invoices]);

  return (
    <div className="fin-card">
      <p className="chart-title">Invoice trends</p>
      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "#0F6E56" }} />Issued
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "#993556", borderRadius: "50%" }} />Voided
        </span>
      </div>
      <div style={{ position: "relative", height: 200 }}>
        <canvas ref={canvasRef} role="img" aria-label="Invoice trend line chart" />
      </div>
    </div>
  );
}