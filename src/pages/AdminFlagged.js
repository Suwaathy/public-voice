import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AdminSidebar from "../components/AdminSidebar";
import "./AdminFlagged.css";

function AdminFlagged() {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    loadFlagged();
  }, []);

  const loadFlagged = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get("http://localhost:5000/api/admin/flagged", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setComplaints(res.data);
    } catch (err) {
      console.error("Error loading flagged complaints:", err);
      setComplaints([]);
    }
  };

  const statusMeta = useMemo(
    () => ({
      Fake: { bg: "var(--danger-50)", bd: "var(--danger-200)", fg: "var(--danger-700)" },
      Verified: { bg: "var(--success-50)", bd: "var(--success-200)", fg: "var(--success-700)" },
      "Under Investigation": {
        bg: "var(--warning-50)",
        bd: "var(--warning-200)",
        fg: "var(--warning-700)",
      },
    }),
    []
  );

  const getBadge = (status) => {
    return statusMeta?.[status] || {
      bg: "#F1F5F9",
      bd: "#E2E8F0",
      fg: "#334155",
    };
  };

  return (
    <>
      <AdminSidebar />

      <div className="admin-flagged-page">
        <div className="admin-flagged-header">
          <div>
            <h1 className="admin-flagged-title">Flagged Complaints</h1>
            <div className="admin-flagged-subtitle">Priority queue for suspicious reports</div>
          </div>
        </div>

        {complaints.length === 0 ? (
          <div className="admin-flagged-empty">No flagged items found.</div>
        ) : (
          <div className="admin-flagged-grid">
            {complaints.map((c) => {
              const status = c.verification?.status || c.status || "";
              const badge = getBadge(status);

              return (
                <div key={c._id} className="admin-flagged-card">
                  <div className="admin-flagged-card-top">
                    <div>
                      <div className="admin-flagged-category">{c.category}</div>
                      <div className="admin-flagged-location">{c.location}</div>
                    </div>

                    <div
                      className="admin-flagged-badge"
                      style={{
                        backgroundColor: badge.bg,
                        borderColor: badge.bd,
                        color: badge.fg,
                      }}
                    >
                      {status || "—"}
                    </div>
                  </div>

                  <div className="admin-flagged-metrics">
                    <div className="admin-flagged-metric">
                      <div className="admin-flagged-metric-label">Confidence</div>
                      <div className="admin-flagged-metric-value">
                        {c.verification?.confidenceScore ?? "—"}
                      </div>
                    </div>

                    <div className="admin-flagged-metric">
                      <div className="admin-flagged-metric-label">Flags</div>
                      <div className="admin-flagged-metric-value">{c.verification?.flagCount ?? "—"}</div>
                    </div>

                    <div className="admin-flagged-metric">
                      <div className="admin-flagged-metric-label">Complaint Status</div>
                      <div className="admin-flagged-metric-value">{c.status ?? "—"}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default AdminFlagged;

