import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import AdminSidebar from "../components/AdminSidebar";

function AdminVerification() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Safely encapsulate the network payload wrapper logic 
  const loadComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get("http://localhost:5000/api/admin/complaints", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Extract complaints array securely from the pagination container wrapper
      setComplaints(res.data.complaints || []);
    } catch (err) {
      console.error("Verification queue loading failure:", err);
      setError("Failed to load verification review queue. Please verify access rights.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const verifyComplaint = async (id, status) => {
    let fakeReason = "";
    let adminNotes = "";

    // Prompt for reasoning based on action context matches
    if (status === "Fake") {
      fakeReason = window.prompt("Enter the reason for rejecting this complaint as Fake:");
      if (fakeReason === null) return; // Terminate operation if the administrator cancels out
    } else {
      adminNotes = window.prompt("Add any administrative verification internal notes (Optional):") || "";
    }

    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `http://localhost:5000/api/admin/complaints/${id}/verify`,
        {
          verificationStatus: status,
          fakeReason,
          adminNotes,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh data grid records immediately upon change
      loadComplaints();
    } catch (err) {
      console.error("Status assignment handling exception:", err);
      alert(err?.response?.data?.message || "Failed to submit verification status update.");
    }
  };

  // Badge aesthetic utility helper
  const getStatusColor = (status) => {
    switch (status) {
      case "Verified": return { bg: "rgba(34,197,94,0.1)", text: "#16a34a" };
      case "Fake": 
      case "Rejected": return { bg: "rgba(220,38,38,0.1)", text: "#dc2626" };
      case "Under Investigation": return { bg: "rgba(37,99,235,0.1)", text: "#2563eb" };
      default: return { bg: "#f1f5f9", text: "#475569" };
    }
  };

  return (
    <>
      <AdminSidebar />

      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Verification Center</h1>
          <div style={styles.subtitle}>Review and verify complaints</div>
        </div>

        {error && (
          <div style={styles.errorBanner} role="alert">
            <span>⚠️ {error}</span>
            <button onClick={loadComplaints} style={styles.retryBtn}>Retry</button>
          </div>
        )}

        <div style={styles.grid}>
          {loading ? (
            <div style={styles.centeredMessage}>⏳ Processing queue records...</div>
          ) : !Array.isArray(complaints) || complaints.length === 0 ? (
            <div style={styles.centeredMessage}>No outstanding complaints require review.</div>
          ) : (
            // Safety Check applied to variable before mapping loops execute
            Array.isArray(complaints) && complaints.map((c) => {
              const currentStatus = c.verification?.status || c.status || "Pending";
              const colors = getStatusColor(currentStatus);

              return (
                <div key={c._id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <div>
                      <h3 style={styles.cardTitle}>{c.category}</h3>
                      <div style={styles.cardLocation}>{c.location}</div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={styles.statusLabel}>Verification Status</div>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: colors.bg,
                        color: colors.text
                      }}>
                        {currentStatus === "Fake" ? "Rejected" : currentStatus}
                      </span>
                    </div>
                  </div>

                  {c.description && (
                    <div style={styles.descriptionBox}>
                      {c.description}
                    </div>
                  )}

                  <div style={styles.buttonGroup}>
                    <button
                      onClick={() => verifyComplaint(c._id, "Verified")}
                      disabled={currentStatus === "Verified"}
                      style={{ ...styles.actionBtn, ...styles.verifyBtn, opacity: currentStatus === "Verified" ? 0.4 : 1 }}
                    >
                      Verify
                    </button>

                    <button
                      onClick={() => verifyComplaint(c._id, "Fake")}
                      disabled={currentStatus === "Fake" || currentStatus === "Rejected"}
                      style={{ ...styles.actionBtn, ...styles.fakeBtn, opacity: (currentStatus === "Fake" || currentStatus === "Rejected") ? 0.4 : 1 }}
                    >
                      Mark Fake
                    </button>

                    <button
                      onClick={() => verifyComplaint(c._id, "Under Investigation")}
                      disabled={currentStatus === "Under Investigation"}
                      style={{ ...styles.actionBtn, ...styles.investigateBtn, opacity: currentStatus === "Under Investigation" ? 0.4 : 1 }}
                    >
                      Investigate
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  container: { marginLeft: "270px", padding: "28px", background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 55%)", minHeight: "calc(100vh - 64px)" },
  header: { marginBottom: 18 },
  title: { margin: 0, fontSize: 26, color: "#0f172a" },
  subtitle: { marginTop: 6, color: "#64748b", fontWeight: 600 },
  errorBanner: { background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: '600' },
  retryBtn: { background: '#B91C1C', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' },
  grid: { display: "grid", gap: 14 },
  card: { background: "#ffffff", borderRadius: 14, border: "1px solid rgba(15,23,42,0.08)", padding: 16, boxShadow: "0 10px 25px rgba(2,6,23,0.05)" },
  cardHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 },
  cardTitle: { margin: 0, fontSize: 16, color: "#0f172a" },
  cardLocation: { marginTop: 6, color: "#64748b", fontWeight: 600, fontSize: 13 },
  statusLabel: { fontSize: 11, color: "#64748b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase" },
  badge: { padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', display: 'inline-block', whiteSpace: 'nowrap' },
  descriptionBox: { marginTop: 12, padding: 12, borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9', color: '#334155', fontSize: 14, lineHeight: 1.5 },
  centeredMessage: { padding: '40px', textAlign: 'center', color: '#64748b', fontWeight: 600, fontSize: 15 },
  buttonGroup: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 },
  actionBtn: { padding: "10px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 13, border: "1px solid dynamic" },
  verifyBtn: { border: "1px solid rgba(34,197,94,0.35)", background: "rgba(34,197,94,0.08)", color: "#16a34a" },
  fakeBtn: { border: "1px solid rgba(220,38,38,0.35)", background: "rgba(220,38,38,0.08)", color: "#dc2626" },
  investigateBtn: { border: "1px solid rgba(37,99,235,0.35)", background: "rgba(37,99,235,0.08)", color: "#2563eb" }
};

export default AdminVerification;