import { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";

const METHOD_COLORS = ["#185FA5", "#3979C2", "#85B7EB", "#B5D4F4"];

export default function MethodBarChart({ payments }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!payments.length) return;

    const methodMap = {};
    payments
      .filter((p) => p.status === "SUCCESS")
      .forEach((p) => {
        const m = p.gatewayMethod || "OTHER";
        methodMap[m] = (methodMap[m] || 0) + Number(p.amount);
      });

    const labels = Object.keys(methodMap);
    const data   = Object.values(methodMap);

    if (chartRef.current) chartRef.current.destroy();

    const isDark    = matchMedia("(prefers-color-scheme: dark)").matches;
    const textColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)";
    const gridColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)";

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: labels.map((_, i) => METHOD_COLORS[i % METHOD_COLORS.length]),
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => " LKR " + ctx.raw.toLocaleString() } },
        },
        scales: {
          x: {
            ticks: { color: textColor, font: { size: 11 }, callback: (v) => "LKR " + (v / 1000).toFixed(0) + "k" },
            grid: { color: gridColor }, border: { display: false },
          },
          y: {
            ticks: { color: textColor, font: { size: 11 } },
            grid: { display: false }, border: { display: false },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [payments]);

  return (
    <div className="fin-card">
      <p className="chart-title">Revenue by payment method</p>
      <div style={{ position: "relative", height: 200 }}>
        <canvas ref={canvasRef} role="img" aria-label="Revenue by payment method bar chart" />
      </div>
    </div>
  );
}