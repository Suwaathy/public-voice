import React from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function AdminAnalyticsCharts({ stats }) {
  const barData = {
    labels: stats?.categoryLabels || [],
    datasets: [
      {
        label: "Complaints by Category",
        data: stats?.categoryCounts || [],
        backgroundColor: "rgba(26, 86, 219, 0.75)",
      },
    ],
  };

  const pieData = {
    labels: stats?.statusLabels || [],
    datasets: [
      {
        label: "Status",
        data: stats?.statusCounts || [],
        backgroundColor: [
          "rgba(26, 86, 219, 0.75)",
          "rgba(14, 159, 110, 0.75)",
          "rgba(251, 191, 36, 0.75)",
          "rgba(239, 68, 68, 0.75)",
          "rgba(99, 102, 241, 0.75)",
        ],
      },
    ],
  };

  return (
    <div
      style={{
        gridColumn: "1 / -1",
        marginTop: 12,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 18,
          borderRadius: 16,
          boxShadow: "0 10px 25px rgba(2,6,23,0.08)",
          border: "1px solid rgba(15,23,42,0.06)",
        }}
      >
        <div style={{ color: "#64748b", fontWeight: 800, marginBottom: 8, fontSize: 13 }}>
          Complaints by Category (Graph)
        </div>
        <div style={{ height: 260 }}>
          <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          padding: 18,
          borderRadius: 16,
          boxShadow: "0 10px 25px rgba(2,6,23,0.08)",
          border: "1px solid rgba(15,23,42,0.06)",
        }}
      >
        <div style={{ color: "#64748b", fontWeight: 800, marginBottom: 8, fontSize: 13 }}>
          Complaints by Status (Diagram)
        </div>
        <div style={{ height: 260 }}>
          <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>
    </div>
  );
}

export default AdminAnalyticsCharts;

