import React from "react";

function AdminCard({ title, value, icon }) {
  return (
    <div
      style={{
        background: "white",
        padding: "18px 18px",
        borderRadius: 16,
        boxShadow: "0 10px 25px rgba(2,6,23,0.08)",
        border: "1px solid rgba(15,23,42,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        {icon ? <div style={{ fontSize: 18 }}>{icon}</div> : null}
        <div style={{ color: "#64748b", fontWeight: 800, fontSize: 13 }}>{title}</div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 950, color: "#0f172a" }}>{value || 0}</div>
    </div>
  );
}

export default AdminCard;

