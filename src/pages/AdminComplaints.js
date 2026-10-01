import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import AdminSidebar from "../components/AdminSidebar";
import { Link } from "react-router-dom";

function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const priorityBg = { Critical: '#FEE2E2', High: '#FEF3C7', Medium: '#DBEAFE', Low: '#D1FAE5' };
  const priorityTxt = { Critical: '#DC2626', High: '#D97706', Medium: '#1A56DB', Low: '#059669' };

  // Wrap inside useCallback to allow safe consumption inside side effects and handlers
  const loadComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get("http://localhost:5000/api/admin/complaints", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints(res.data.complaints || []);
    } catch (err) {
      setError("Failed to load complaints. Please check your connection or login status.");
      console.error("Error loading complaints:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const deleteComplaint = async (id) => {
    setError(null);
    try {
      const token = localStorage.getItem("adminToken");
      await axios.delete(`http://localhost:5000/api/admin/complaints/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadComplaints();
    } catch (err) {
      console.error("Delete operation failed:", err);
      setError(err?.response?.data?.message || "Failed to delete complaint. Please try again.");
    }
  };

  return (
    <>
      <AdminSidebar />

      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Complaints</h1>
          <div style={styles.subtitle}>Admin review queue</div>
        </div>

        {error && (
          <div style={styles.errorBanner} role="alert">
            <span>⚠️ {error}</span>
            <button onClick={loadComplaints} style={styles.retryButton}>Retry</button>
          </div>
        )}

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeadRow}>
                <th style={{...styles.th, width: '15%'}}>Category</th>
                <th style={{...styles.th, width: '30%'}}>Description</th>
                <th style={{...styles.th, width: '10%'}}>Priority</th>
                <th style={{...styles.th, width: '10%'}}>Status</th>
                <th style={{...styles.th, width: '10%'}}>Verification</th>
                <th style={{...styles.th, width: '5%'}}>Votes</th>
                <th style={{...styles.th, width: '10%'}}>Attachments</th>
                <th style={{...styles.th, width: '10%'}}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={styles.centeredCell}>⏳ Loading complaints...</td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan="8" style={styles.centeredCell}>No complaints found.</td>
                </tr>
              ) : (
                complaints.map((c) => {
                  // Normalize attachment objects cleanly inside the iteration loop block
                  const attachments = [];
                  if (Array.isArray(c.imageUrls)) {
                    c.imageUrls.forEach((u) => u && attachments.push({ url: u, type: 'image' }));
                  } else if (c.imageUrl) {
                    attachments.push({ url: c.imageUrl, type: 'image' });
                  }
                  if (Array.isArray(c.attachments)) {
                    c.attachments.forEach((a) => a?.url && attachments.push({ url: a.url, type: a.type || 'document' }));
                  }

                  return (
                    <tr key={c._id} style={styles.tableBodyRow}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 600 }}>{c.category}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{c.location}</div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.descriptionCell}>
                          {c.description || c.transcription || '—'}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: priorityBg[c.priority] || '#E2E8F0',
                          color: priorityTxt[c.priority] || '#334155',
                        }}>
                          {c.priority}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, backgroundColor: '#F1F5F9', color: '#475569' }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={styles.td}>{c.verification?.status || 'Pending'}</td>
                      <td style={styles.td}>{c.votes ?? 0}</td>
                      <td style={styles.td}>
                        {!attachments.length ? (
                          <span style={styles.noFiles}>No files</span>
                        ) : (
                          <div style={styles.attachmentsContainer}>
                            {attachments.map((a, idx) => {
                              const isImage = a.type === 'image';
                              const fileName = (a.url || '').split('/').pop() || 'attachment';
                              const computedUrl = a.url?.startsWith('http') ? a.url : `http://localhost:5000${a.url}`;

                              return (
                                <div key={`${c._id}-attach-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  {isImage ? (
                                    <img
                                      src={computedUrl}
                                      alt={fileName}
                                      title={fileName}
                                      onClick={() => window.open(computedUrl, '_blank', 'noopener,noreferrer')}
                                      style={styles.attachmentImage}
                                    />
                                  ) : (
                                    <a
                                      href={computedUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={styles.attachmentLink}
                                    >
                                      <span style={{ marginRight: 6 }} aria-hidden="true">📎</span>
                                      View Doc
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Link to={`/admin/verify/${c._id}`} style={styles.actionButton}>
                            Verify
                          </Link>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this complaint?')) {
                                deleteComplaint(c._id);
                              }
                            }}
                            style={{ ...styles.actionButton, ...styles.deleteButton }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: { marginLeft: "270px", padding: "28px", background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 55%)", minHeight: "calc(100vh - 64px)" },
  header: { marginBottom: 24 },
  title: { margin: 0, fontSize: 26, color: "#0f172a" },
  subtitle: { marginTop: 6, color: "#64748b", fontWeight: 600 },
  errorBanner: { background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: '600' },
  retryButton: { background: '#B91C1C', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' },
  tableContainer: { overflowX: 'auto', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 14 },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 1100, tableLayout: 'fixed' },
  tableHeadRow: { background: "#f1f5f9" },
  th: { textAlign: "left", padding: "12px 16px", color: "#334155", fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' },
  tableBodyRow: { background: "white" },
  td: { padding: "14px 16px", borderTop: "1px solid rgba(15,23,42,0.06)", color: "#0f172a", fontSize: 14, verticalAlign: 'top' },
  centeredCell: { padding: '40px', textAlign: 'center', color: '#64748b', fontWeight: 600 },
  descriptionCell: { fontSize: 13, fontWeight: 600, color: '#334155', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' },
  badge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-block', whiteSpace: 'nowrap' },
  noFiles: { color: '#94a3b8', fontStyle: 'italic', fontWeight: 600, fontSize: 13 },
  attachmentsContainer: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' },
  attachmentImage: { width: 64, height: 44, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(15,23,42,0.08)', cursor: 'pointer' },
  attachmentLink: { color: '#1d4ed8', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center' },
  actionButton: { padding: "8px 12px", borderRadius: 10, border: "1px solid #d1d5db", background: "#f9fafb", color: "#374151", cursor: "pointer", fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'inline-block' },
  deleteButton: { borderColor: "rgba(220,38,38,0.35)", background: "rgba(220,38,38,0.08)", color: "#dc2626" },
};

export default AdminComplaints;