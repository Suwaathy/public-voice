import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useAutoTranslateObject } from '../hooks/useAutoTranslate';
import { useAutoTranslate } from '../hooks/useAutoTranslate';
import axios from 'axios';

const priorityBg = { Critical: '#FEE2E2', High: '#FEF3C7', Medium: '#DBEAFE', Low: '#D1FAE5' };
const priorityTxt = { Critical: '#DC2626', High: '#D97706', Medium: '#1A56DB', Low: '#059669' };
const catIcon = { Roads: '🛣️', Water: '💧', Safety: '⚠️', Environment: '🌿', Corruption: '⚖️', Other: '📋' };

const ComplaintCard = ({ complaint, onVote, user, t }) => {
  const translated = useAutoTranslateObject({
    description: complaint.description || complaint.transcription || '',
    location: complaint.location || '',
    category: complaint.category || '',
    status: complaint.status || '',
    priority: complaint.priority || '',
  });

  return (
    <div style={styles.card}>
      <div style={styles.cardTop}>
        <div style={styles.cardLeft}>
          <span style={styles.icon}>{catIcon[complaint.category] || '📋'}</span>
          <div>
            <span style={styles.category}>{translated.category}</span>
            <span style={styles.location}> · 📍 {translated.location}</span>
          </div>
        </div>
        <div style={styles.cardRight}>
          <span style={{ ...styles.badge, backgroundColor: priorityBg[complaint.priority], color: priorityTxt[complaint.priority] }}>
            {translated.priority}
          </span>
          <span style={{ fontSize: '13px', color: complaint.status === 'Resolved' ? '#059669' : complaint.status === 'In Progress' ? '#1A56DB' : '#6B7280', fontWeight: '600' }}>
            ● {translated.status}
          </span>
        </div>
      </div>
      <p style={styles.desc}>{translated.description}</p>
      <div style={styles.cardFooter}>
        <span style={styles.date}>📅 {new Date(complaint.createdAt || Date.now()).toLocaleDateString()}</span>
        <button
          onClick={() => onVote(complaint._id || complaint.id)}
          style={{ ...styles.voteBtn, backgroundColor: complaint.voted ? '#1A56DB' : '#F3F4F6', color: complaint.voted ? '#fff' : '#374151' }}
        >
          👍 {complaint.votes} {complaint.voted ? t('voted') : t('upvote')}
        </button>
      </div>
    </div>
  );
};

const PublicFeed = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState('All');
  const [priFilter, setPriFilter] = useState('All');
  const [sort, setSort] = useState('Newest');

  const filterTitle = useAutoTranslate('Filter By');
  const categoryLabel = useAutoTranslate('Category');
  const priorityLabel = useAutoTranslate('Priority');
  const sortLabel = useAutoTranslate('Sort By');
  const allLabel = useAutoTranslate('All');
  const newestLabel = useAutoTranslate('Newest');
  const mostVotedLabel = useAutoTranslate('Most Voted');
  const criticalFirstLabel = useAutoTranslate('Critical First');
  const noResultsText = useAutoTranslate('No complaints match your filters.');
  const feedTitle = useAutoTranslate('Public Feed');

  useEffect(() => { fetchComplaints(); }, []);

  const fetchComplaints = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/complaints/public');
      if (res.data.length > 0) {
        setComplaints(res.data.map(c => ({ ...c, voted: false })));
      } else {
        setComplaints(mockData);
      }
    } catch {
      setComplaints(mockData);
    } finally {
      setLoading(false);
    }
  };

  const mockData = [
    { _id: '1', category: 'Roads', location: 'Kandy Town', description: 'Large pothole near the main junction causing accidents daily.', createdAt: new Date(), status: 'In Progress', priority: 'High', votes: 23, voted: false },
    { _id: '2', category: 'Water', location: 'Peradeniya', description: 'Burst water pipe on main road. Water wasted for 3 days.', createdAt: new Date(), status: 'Pending', priority: 'Critical', votes: 41, voted: false },
    { _id: '3', category: 'Environment', location: 'Ampitiya', description: 'Illegal dumping near school. Foul smell affecting students.', createdAt: new Date(), status: 'Resolved', priority: 'Medium', votes: 12, voted: true },
    { _id: '4', category: 'Safety', location: 'Katugastota', description: 'Broken street lights on main road — dangerous at night.', createdAt: new Date(), status: 'Pending', priority: 'High', votes: 35, voted: false },
    { _id: '5', category: 'Corruption', location: 'Gampola', description: 'Local officer demanding bribes for construction permits.', createdAt: new Date(), status: 'Pending', priority: 'Critical', votes: 58, voted: false },
  ];

  const handleVote = async (id) => {
    if (!user) { alert(t('login_to_vote')); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`http://localhost:5000/api/votes/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(prev => prev.map(c =>
        (c._id === id || c.id === id)
          ? { ...c, votes: res.data.votes, voted: res.data.voted }
          : c
      ));
    } catch {
      setComplaints(prev => prev.map(c =>
        (c._id === id || c.id === id)
          ? { ...c, votes: c.voted ? c.votes - 1 : c.votes + 1, voted: !c.voted }
          : c
      ));
    }
  };

  const categories = ['All', 'Roads', 'Water', 'Safety', 'Environment', 'Corruption', 'Other'];
  const priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  const filtered = complaints
    .filter(c => catFilter === 'All' || c.category === catFilter)
    .filter(c => priFilter === 'All' || c.priority === priFilter)
    .sort((a, b) => {
      if (sort === 'Most Voted') return b.votes - a.votes;
      if (sort === 'Critical First') return a.priority === 'Critical' ? -1 : 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div style={styles.wrapper}>
      <div style={styles.sidebar}>
        <h3 style={styles.sidebarTitle}>{filterTitle}</h3>
        <p style={styles.filterLabel}>{categoryLabel}</p>
        {categories.map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            style={{ ...styles.sidebarBtn, backgroundColor: catFilter === c ? '#1A56DB' : '#F3F4F6', color: catFilter === c ? '#fff' : '#374151' }}>
            {catIcon[c] || ''} {c === 'All' ? allLabel : c}
          </button>
        ))}
        <p style={{ ...styles.filterLabel, marginTop: '16px' }}>{priorityLabel}</p>
        {priorities.map(p => (
          <button key={p} onClick={() => setPriFilter(p)}
            style={{ ...styles.sidebarBtn, backgroundColor: priFilter === p ? '#1A56DB' : '#F3F4F6', color: priFilter === p ? '#fff' : '#374151' }}>
            {p === 'All' ? allLabel : p}
          </button>
        ))}
        <p style={{ ...styles.filterLabel, marginTop: '16px' }}>{sortLabel}</p>
        {[
          { val: 'Newest', label: newestLabel },
          { val: 'Most Voted', label: mostVotedLabel },
          { val: 'Critical First', label: criticalFirstLabel },
        ].map(s => (
          <button key={s.val} onClick={() => setSort(s.val)}
            style={{ ...styles.sidebarBtn, backgroundColor: sort === s.val ? '#0E9F6E' : '#F3F4F6', color: sort === s.val ? '#fff' : '#374151' }}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={styles.feed}>
        <h2 style={styles.title}>
          {feedTitle} <span style={styles.count}>({filtered.length})</span>
        </h2>
        {loading ? (
          <p style={{ color: '#6B7280', textAlign: 'center', padding: '40px' }}>⏳ Loading...</p>
        ) : filtered.length === 0 ? (
          <p style={styles.empty}>{noResultsText}</p>
        ) : (
          filtered.map(c => (
            <ComplaintCard key={c._id || c.id} complaint={c} onVote={handleVote} user={user} t={t} />
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  wrapper: { display: 'flex', gap: '24px', padding: '32px', backgroundColor: '#F9FAFB', minHeight: '100vh', alignItems: 'flex-start' },
  sidebar: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', width: '200px', flexShrink: 0, position: 'sticky', top: '80px' },
  sidebarTitle: { fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '16px' },
  filterLabel: { fontSize: '12px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: '8px' },
  sidebarBtn: { display: 'block', width: '100%', padding: '8px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', marginBottom: '6px', textAlign: 'left' },
  feed: { flex: 1 },
  title: { fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '20px' },
  count: { fontSize: '16px', color: '#6B7280', fontWeight: '400' },
  empty: { color: '#6B7280', textAlign: 'center', padding: '60px' },
  card: { backgroundColor: '#fff', borderRadius: '10px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' },
  cardLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  cardRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  icon: { fontSize: '24px' },
  category: { fontSize: '14px', fontWeight: '700', color: '#111827' },
  location: { fontSize: '13px', color: '#6B7280' },
  badge: { padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },
  desc: { fontSize: '14px', color: '#374151', lineHeight: '1.6', marginBottom: '14px' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: '13px', color: '#9CA3AF' },
  voteBtn: { border: 'none', padding: '8px 18px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
};

export default PublicFeed;