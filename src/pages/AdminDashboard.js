import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "../components/AdminLayout";
import AdminAnalyticsCharts from "./AdminAnalyticsCharts";

function AdminDashboard() {
  const [stats, setStats] = useState(null); // Init as null to detect loading state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get("http://localhost:5000/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStats(res.data);
    } catch (err) {
      const status = err?.response?.status;
      console.error("Admin stats fetch failed:", err);

      if (status === 401) {
        localStorage.removeItem("adminToken");
        // Redirect to login here if your router setup permits
      }
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  // Safe calculation for response time in days
  const avgResponseDays =
  stats?.avgResponseMs != null && stats.avgResponseMs > 0
    ? (Number(stats.avgResponseMs) / (1000 * 60 * 60 * 24)).toFixed(1)
    : "0.0";

  // Resolves the name of the top category safely
  const topCategoryName = stats?.byCategory?.[0]?._id ?? "N/A";

  if (loading) {
    return (
      <AdminLayout title="Admin Dashboard" subtitle="Overview">
        <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
          Loading dashboard metrics...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Admin Dashboard" subtitle="Overview">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
          gap: "16px",
        }}
      >
        <Card title="Total" value={stats?.total} />
        <Card title="Pending" value={stats?.pending} />
        <Card title="In Progress" value={stats?.inProgress} />
        <Card title="Resolved" value={stats?.resolved} />
        <Card title="Verified" value={stats?.verified} />
        <Card title="Fake" value={stats?.fake} />
        <Card title="Flagged" value={stats?.flagged} />

        {/* Analytics Section Divider */}
        <div
          style={{
            gridColumn: "1 / -1",
            marginTop: "16px",
            marginBottom: "4px",
            color: "#64748b",
            fontWeight: 700,
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            borderBottom: "1px solid rgba(15,23,42,0.08)",
            paddingBottom: "8px"
          }}
        >
          Analytics
        </div>
        
        <div
          style={{ gridColumn: "1 / -1", display: "flex", gap: 16, flexWrap: "wrap" }}
        >
          <Card title="Avg. Votes" value={stats?.avgVotes} />
          <Card title="Avg. Response (days)" value={avgResponseDays} />
          {/* Displays the category name, with the absolute count appended below it optionally */}
          <Card 
            title="Top Category" 
            value={topCategoryName} 
            subtitle={stats?.topCategoryCount ? `${stats.topCategoryCount} complaints` : null} 
          />
        </div>

        {/* Chart components section */}
        <div style={{ gridColumn: "1 / -1", marginTop: "16px" }}>
        <AdminAnalyticsCharts stats={stats || {}} />
      </div>
      </div>
    </AdminLayout>
  );
}

function Card({ title, value, subtitle }) {
  const isNumeric = value != null && (!isNaN(value) || /^\d+(\.\d+)?$/.test(value));
  
  return (
    <div
      style={{
        background: "white",
        padding: "18px",
        borderRadius: "16px",
        boxShadow: "0 10px 25px rgba(2,6,23,0.08)",
        border: "1px solid rgba(15,23,42,0.06)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}
    >
      <div>
        <div style={{ color: '#64748b', fontWeight: 700, marginBottom: 8, fontSize: 13 }}>
          {title}
        </div>
        {/* uses isNumeric to render decimal strings cleanly at 30px */}
        <div style={{ 
          fontSize: isNumeric ? 30 : 22, 
          fontWeight: 900, 
          color: '#0f172a', 
          wordBreak: 'break-word' 
        }}>
          {value ?? 0}
        </div>
      </div>
      {subtitle && (
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;