import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "../components/AdminSidebar";

function AdminVerifyComplaint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [verificationStatus, setVerificationStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchComplaint = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("adminToken");
        const res = await axios.get(
          `http://localhost:5000/api/admin/complaints/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setComplaint(res.data);
        setVerificationStatus(res.data.verification.status);
        setAdminNotes(res.data.verification.adminNotes || "");
      } catch (err) {
        setError("Failed to load complaint details.");
        console.error("Error fetching complaint:", err);
      }
      setLoading(false);
    };

    fetchComplaint();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!verificationStatus) {
      alert("Please select a verification status.");
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `http://localhost:5000/api/admin/complaints/${id}/verify`,
        { verificationStatus, adminNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Verification status updated successfully!");
      navigate("/admin/complaints");
    } catch (err) {
      alert("Failed to update status. Please try again.");
      console.error("Error updating verification status:", err);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <>
        <AdminSidebar />
        <div style={styles.container}>
          <p style={styles.centeredMessage}>⏳ Loading complaint details...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AdminSidebar />
        <div style={styles.container}>
          <p style={{ ...styles.centeredMessage, color: "#dc2626" }}>{error}</p>
        </div>
      </>
    );
  }

  if (!complaint) {
    return (
      <>
        <AdminSidebar />
        <div style={styles.container}>
          <p style={styles.centeredMessage}>Complaint not found.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminSidebar />
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Verify Complaint</h1>
          <div style={styles.subtitle}>Review and update the verification status for complaint #{complaint._id.slice(-6)}</div>
        </div>

        <div style={styles.contentGrid}>
          {/* Complaint Details Column */}
          <div style={styles.detailsCard}>
            <h3 style={styles.cardTitle}>Complaint Details</h3>
            <DetailRow label="Category" value={complaint.category} />
            <DetailRow label="Location" value={complaint.location} />
            <DetailRow label="Priority" value={complaint.priority} />
            <DetailRow label="Status" value={complaint.status} />
            <DetailRow label="Votes" value={complaint.votes} />
            <DetailRow label="Submitted On" value={new Date(complaint.createdAt).toLocaleString()} />
            <DetailRow label="Description" value={complaint.description || complaint.transcription || "N/A"} isBlock />

            <h4 style={styles.attachmentsTitle}>Attachments</h4>
            <div style={styles.attachmentsGrid}>
              {(complaint.imageUrls || []).map((url, idx) => (
                <a key={idx} href={`http://localhost:5000${url}`} target="_blank" rel="noopener noreferrer" aria-label={`View attachment ${idx + 1}`}>
                  <img src={`http://localhost:5000${url}`} alt={`attachment-${idx}`} style={styles.attachmentImage} />
                </a>
              ))}
              {!complaint.imageUrls?.length && <p style={styles.noAttachments}>No attachments found.</p>}
            </div>
          </div>

          {/* Verification Form Column */}
          <div style={styles.formCard}>
            <h3 style={styles.cardTitle}>Verification Action</h3>
            <form onSubmit={handleSubmit}>
              <label style={styles.label}>Verification Status *</label>
              <select
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value)}
                style={styles.input}
              >
                <option value="Unverified">Unverified</option>
                <option value="Verified">Verified</option>
                <option value="Fake">Fake</option>
                <option value="Under Investigation">Under Investigation</option>
              </select>

              <label style={styles.label}>Admin Notes (Optional)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any internal notes for this verification..."
                style={{ ...styles.input, height: 120, resize: 'vertical' }}
              />

              <button type="submit" disabled={submitting} style={styles.submitButton}>
                {submitting ? "Submitting..." : "Update Status"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

const DetailRow = ({ label, value, isBlock = false }) => (
  <div style={{ ...styles.detailRow, flexDirection: isBlock ? 'column' : 'row', alignItems: isBlock ? 'flex-start' : 'center' }}>
    <span style={styles.detailLabel}>{label}</span>
    <span style={styles.detailValue}>{value}</span>
  </div>
);

const styles = {
  container: { marginLeft: "270px", padding: "28px", background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 55%)", minHeight: "calc(100vh - 64px)" },
  header: { marginBottom: 24 },
  title: { margin: 0, fontSize: 26, color: "#0f172a" },
  subtitle: { marginTop: 6, color: "#64748b", fontWeight: 600 },
  centeredMessage: { textAlign: 'center', padding: '50px', fontSize: 16, color: '#64748b' },
  contentGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'flex-start' },
  detailsCard: { background: '#fff', borderRadius: 14, border: '1px solid rgba(15,23,42,0.08)', padding: 24 },
  formCard: { background: '#fff', borderRadius: 14, border: '1px solid rgba(15,23,42,0.08)', padding: 24, position: 'sticky', top: 20 },
  cardTitle: { marginTop: 0, marginBottom: 20, fontSize: 18, color: '#111827' },
  detailRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' },
  detailLabel: { fontWeight: 600, color: '#475569', fontSize: 14 },
  detailValue: { color: '#0f172a', fontSize: 14, textAlign: 'right' },
  attachmentsTitle: { marginTop: 24, marginBottom: 12, fontSize: 16, color: '#111827' },
  attachmentsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 },
  attachmentImage: { width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' },
  noAttachments: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic' },
  label: { display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: { width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box', fontFamily: 'inherit' },
  submitButton: {
    width: '100%',
    padding: '12px',
    borderRadius: 10,
    border: 'none',
    background: '#1A56DB',
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    opacity: 1,
  },
};

export default AdminVerifyComplaint;
