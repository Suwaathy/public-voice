import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import AdminSidebar from "../components/AdminSidebar";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadUsers = useCallback(async (pageNumber = 1) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`http://localhost:5000/api/admin/users?page=${pageNumber}&limit=20`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // target the user array inside the updated backend pagination envelope
      setUsers(res.data.users || []);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Error loading system users:", err);
      setError("Failed to fetch registered accounts. Please check authorization or try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers(currentPage);
  }, [currentPage, loadUsers]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <>
      <AdminSidebar />

      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Users</h1>
          <div style={styles.subtitle}>Registered accounts</div>
        </div>

        {error && (
          <div style={styles.errorStrip} role="alert">
            <span>{error}</span>
            <button onClick={() => loadUsers(currentPage)} style={styles.retryBtn}>Retry</button>
          </div>
        )}

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Language</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={styles.centerCell}>⏳ Processing server records...</td>
                </tr>
              ) : !Array.isArray(users) || users.length === 0 ? (
                <tr>
                  <td colSpan="4" style={styles.centerCell}>No registered accounts found.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} style={styles.tbRow}>
                    <td style={styles.td}>{u.name}</td>
                    <td style={styles.td}>{u.email}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.roleBadge,
                        backgroundColor: u.role === 'SuperAdmin' || u.role === 'Admin' ? '#EEF2F6' : '#F1F5F9',
                        color: u.role === 'SuperAdmin' ? '#4F46E5' : '#475569'
                      }}>
                        {u.role || 'Citizen'}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textTransform: 'uppercase', fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                      {u.language || 'en'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {pagination.pages > 1 && (
          <div style={styles.paginationRow}>
            <button 
              onClick={() => handlePageChange(currentPage - 1)} 
              disabled={currentPage === 1 || loading}
              style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <span style={styles.pageLabel}>
              Page <strong>{pagination.page}</strong> of {pagination.pages}
            </span>
            <button 
              onClick={() => handlePageChange(currentPage + 1)} 
              disabled={currentPage === pagination.pages || loading}
              style={{ ...styles.pageBtn, opacity: currentPage === pagination.pages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  container: { marginLeft: "270px", padding: "28px", background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 55%)", minHeight: "calc(100vh - 64px)" },
  header: { marginBottom: 18 },
  title: { margin: 0, fontSize: 26, color: "#0f172a" },
  subtitle: { marginTop: 6, color: "#64748b", fontWeight: 600 },
  errorStrip: { background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 600 },
  retryBtn: { background: '#B91C1C', color: '#FFF', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 },
  tableWrapper: { overflowX: 'auto', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 14 },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0 },
  thRow: { background: "#f1f5f9" },
  th: { textAlign: "left", padding: "12px 14px", color: "#334155", fontSize: 13, fontWeight: 700 },
  tbRow: { background: "white" },
  td: { padding: "12px 14px", borderTop: "1px solid rgba(15,23,42,0.06)", color: "#0f172a", fontSize: 14 },
  centerCell: { padding: '36px', textAlign: 'center', color: '#64748b', fontWeight: 600, fontSize: 14 },
  roleBadge: { padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 },
  paginationRow: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '16px' },
  pageLabel: { fontSize: '13px', color: '#475569' },
  pageBtn: { background: '#FFF', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: '8px', color: '#334155', fontWeight: 600, fontSize: '12px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }
};

export default AdminUsers;