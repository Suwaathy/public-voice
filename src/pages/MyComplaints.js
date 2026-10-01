import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAutoTranslate, useAutoTranslateObject } from '../hooks/useAutoTranslate';
import axios from 'axios';

const priorityBg = { Critical: '#FEE2E2', High: '#FEF3C7', Medium: '#DBEAFE', Low: '#D1FAE5' };
const priorityTxt = { Critical: '#DC2626', High: '#D97706', Medium: '#1A56DB', Low: '#059669' };

const ComplaintCard = ({ c, onView, t }) => {
  const translated = useAutoTranslateObject({
    description: c.description || c.transcription || '',
    location: c.location || '',
    category: c.category || '',
    status: c.status || '',
    priority: c.priority || '',
  });
  const viewText = useAutoTranslate('View Details →');

  return (
    <div style={styles.complaintCard}>
      <div style={styles.cardTop}>
        <div style={styles.cardLeft}>
          <span style={styles.complaintId}>{c._id?.slice(-6) || c.id}</span>
          <span style={styles.categoryTag}>{translated.category}</span>
        </div>
        <div style={styles.cardRight}>
          <span style={{ ...styles.badge, backgroundColor: priorityBg[c.priority], color: priorityTxt[c.priority] }}>
            {translated.priority}
          </span>
          <span style={{ fontSize: '13px', color: c.status === 'Resolved' ? '#059669' : c.status === 'In Progress' ? '#1A56DB' : '#6B7280', fontWeight: '600' }}>
            ● {translated.status}
          </span>
        </div>
      </div>
      <p style={styles.cardDesc}>{translated.description}</p>
      <div style={styles.cardFooter}>
        <span style={styles.cardMeta}>
          📅 {new Date(c.createdAt || Date.now()).toLocaleDateString()} &nbsp; 👍 {c.votes || 0}
        </span>
        <button onClick={() => onView(c)} style={styles.viewBtn}>{viewText}</button>
      </div>
    </div>
  );
};

const getTimelineDate = (c, wantedStatus) => {
  const timeline = Array.isArray(c.timeline) ? c.timeline : [];
  const match = timeline.find((x) => x?.status === wantedStatus) || timeline.find((x) => x?.verificationStatus === wantedStatus);
  if (!match?.date) return '—';
  return new Date(match.date).toLocaleString();
};

const ComplaintDetail = ({ c, onBack }) => {
  const translated = useAutoTranslateObject({
    description: c.description || c.transcription || '',
    location: c.location || '',
    category: c.category || '',
    status: c.status || '',
    priority: c.priority || '',
  });
  const backText = useAutoTranslate('← Back to My Complaints');
  const detailTitle = useAutoTranslate('Complaint Detail');
  const timelineTitle = useAutoTranslate('Status Timeline');

  const labels = {
    id: useAutoTranslate('Complaint ID'),
    category: useAutoTranslate('Category'),
    location: useAutoTranslate('Location'),
    description: useAutoTranslate('Description'),
    date: useAutoTranslate('Date Submitted'),
    votes: useAutoTranslate('Votes'),
    priority: useAutoTranslate('Priority'),
    submitted: useAutoTranslate('Submitted'),
    review: useAutoTranslate('Under Review'),
    progress: useAutoTranslate('In Progress'),
    resolved: useAutoTranslate('Resolved'),
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <button onClick={onBack} style={styles.backLink}>{backText}</button>
        <h2 style={styles.title}>{detailTitle}</h2>
        <div style={styles.detailBox}>
          {[
            { label: labels.id, value: c._id || c.id },
            { label: labels.category, value: translated.category },
            { label: labels.location, value: translated.location },
            { label: labels.description, value: translated.description },
            { label: labels.date, value: new Date(c.createdAt || Date.now()).toLocaleDateString() },
            { label: labels.votes, value: `👍 ${c.votes || 0}` },
            { label: labels.priority, value: translated.priority },
          ].map((row, i) => (
            <div key={i} style={{ ...styles.detailRow, borderBottom: '1px solid #E5E7EB' }}>
              <span style={styles.detailLabel}>{row.label}</span>
              <span style={styles.detailValue}>{row.value}</span>
            </div>
          ))}

          {c.imageUrl ? (
            <div style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', marginBottom: 8 }}>
                Image
              </div>
              <img
                src={c.imageUrl}
                alt="complaint"
                style={{ width: '100%', maxHeight: 340, objectFit: 'cover', borderRadius: 10, border: '1px solid #E5E7EB' }}
              />
            </div>
          ) : null}
        </div>
        <h3 style={styles.timelineTitle}>{timelineTitle}</h3>
        <div style={styles.timeline}>
          {[
            { label: labels.submitted, done: true, date: new Date(c.createdAt || Date.now()).toLocaleDateString() },
            { label: labels.review, done: c.status !== 'Pending', date: getTimelineDate(c, 'Under Investigation') },
            { label: labels.progress, done: c.status === 'In Progress' || c.status === 'Resolved', date: getTimelineDate(c, 'In Progress') },
            { label: labels.resolved, done: c.status === 'Resolved', date: getTimelineDate(c, 'Resolved') },
          ].map((item, i) => (
            <div key={i} style={styles.timelineItem}>
              <div style={{ ...styles.timelineDot, backgroundColor: item.done ? '#059669' : '#D1D5DB' }} />
              <div>
                <p style={{ fontWeight: '600', color: item.done ? '#059669' : '#9CA3AF', margin: 0, fontSize: '14px' }}>{item.label}</p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MyComplaints = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const pageTitle = useAutoTranslate('My Complaints');
  const searchPlaceholder = useAutoTranslate('Search complaints...');
  const noComplaintsText = useAutoTranslate('No complaints found.');
  const allLabel = useAutoTranslate('All');
  const pendingLabel = useAutoTranslate('Pending');
  const inProgressLabel = useAutoTranslate('In Progress');
  const resolvedLabel = useAutoTranslate('Resolved');

  useEffect(() => { fetchMyComplaints(); }, []);

  const fetchMyComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/complaints/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(res.data);
    } catch {
      setComplaints(mockData);
    } finally {
      setLoading(false);
    }
  };

  const mockData = [
    { _id: 'PV001', category: 'Roads', description: 'Large pothole near Kandy town causing accidents.', location: 'Kandy Town', createdAt: new Date(), status: 'In Progress', priority: 'High', votes: 23 },
    { _id: 'PV002', category: 'Water', description: 'Burst pipe on Peradeniya road, water wastage.', location: 'Peradeniya', createdAt: new Date(), status: 'Pending', priority: 'Critical', votes: 41 },
    { _id: 'PV003', category: 'Environment', description: 'Illegal dumping site near the school compound.', location: 'Ampitiya', createdAt: new Date(), status: 'Resolved', priority: 'Medium', votes: 12 },
  ];

  const filterOptions = [
    { val: 'All', label: allLabel },
    { val: 'Pending', label: pendingLabel },
    { val: 'In Progress', label: inProgressLabel },
    { val: 'Resolved', label: resolvedLabel },
  ];

  const filtered = complaints.filter(c => {
    const matchFilter = filter === 'All' || c.status === filter;
    const matchSearch = (c.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.category || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (selected) return <ComplaintDetail c={selected} onBack={() => setSelected(null)} />;

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>{pageTitle}</h2>
        <div style={styles.filterBar}>
          <div style={styles.filterTabs}>
            {filterOptions.map(f => (
              <button key={f.val} onClick={() => setFilter(f.val)}
                style={{ ...styles.filterTab, backgroundColor: filter === f.val ? '#1A56DB' : '#F3F4F6', color: filter === f.val ? '#fff' : '#374151' }}>
                {f.label}
              </button>
            ))}
          </div>
          <input placeholder={searchPlaceholder} value={search}
            onChange={e => setSearch(e.target.value)} style={styles.search} />
        </div>
        {loading ? (
          <p style={{ color: '#6B7280', textAlign: 'center', padding: '40px' }}>⏳ Loading...</p>
        ) : filtered.length === 0 ? (
          <p style={styles.empty}>{noComplaintsText}</p>
        ) : (
          filtered.map(c => (
            <ComplaintCard key={c._id || c.id} c={c} onView={setSelected} t={t} />
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  wrapper: { minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '40px 16px', display: 'flex', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '750px', height: 'fit-content' },
  title: { fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '24px' },
  filterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  filterTabs: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  filterTab: { padding: '8px 16px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  search: { padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', width: '200px' },
  empty: { color: '#6B7280', textAlign: 'center', padding: '40px' },
  complaintCard: { border: '1px solid #E5E7EB', borderRadius: '10px', padding: '18px', marginBottom: '16px' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' },
  cardLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  cardRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  complaintId: { fontSize: '13px', color: '#6B7280', fontWeight: '600' },
  categoryTag: { backgroundColor: '#EFF6FF', color: '#1A56DB', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  badge: { padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },
  cardDesc: { fontSize: '14px', color: '#374151', lineHeight: '1.6', marginBottom: '12px' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardMeta: { color: '#6B7280', fontSize: '13px' },
  viewBtn: { backgroundColor: '#EFF6FF', color: '#1A56DB', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  backLink: { backgroundColor: 'transparent', border: 'none', color: '#1A56DB', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginBottom: '16px', padding: 0 },
  detailBox: { backgroundColor: '#F9FAFB', borderRadius: '10px', overflow: 'hidden', border: '1px solid #E5E7EB', marginBottom: '24px' },
  detailRow: { display: 'flex', justifyContent: 'space-between', padding: '14px 18px', gap: '12px' },
  detailLabel: { fontSize: '13px', fontWeight: '600', color: '#6B7280' },
  detailValue: { fontSize: '14px', color: '#111827', textAlign: 'right' },
  timelineTitle: { fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '16px' },
  timeline: { display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '8px' },
  timelineItem: { display: 'flex', alignItems: 'center', gap: '14px' },
  timelineDot: { width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0 },
};

export default MyComplaints;