import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAutoTranslate } from '../hooks/useAutoTranslate';

const SampleComplaint = ({ desc, category, priority, votes, status }) => {
  const translatedDesc = useAutoTranslate(desc);
  const translatedCategory = useAutoTranslate(category);
  const translatedStatus = useAutoTranslate(status);
  const priorityBg = { Critical: '#FEE2E2', High: '#FEF3C7', Medium: '#DBEAFE', Low: '#D1FAE5' };
  return (
    <div style={styles.card}>
      <div style={styles.cardTop}>
        <span style={styles.category}>{translatedCategory}</span>
        <span style={{ ...styles.priorityBadge, backgroundColor: priorityBg[priority] }}>{priority}</span>
      </div>
      <p style={styles.cardDesc}>{translatedDesc}</p>
      <div style={styles.cardBottom}>
        <span>👍 {votes}</span>
        <span style={{ color: priority === 'Resolved' ? '#059669' : '#1A56DB', fontWeight: '600' }}>{translatedStatus}</span>
      </div>
    </div>
  );
};

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    { icon: '🎤', titleKey: 'feature_voice_title', descKey: 'feature_voice_desc' },
    { icon: '🌐', titleKey: 'feature_multilingual_title', descKey: 'feature_multilingual_desc' },
    { icon: '📍', titleKey: 'feature_tracking_title', descKey: 'feature_tracking_desc' },
  ];

  const sampleComplaints = [
    { desc: 'Large pothole near Kandy town causing accidents daily.', category: 'Roads', priority: 'High', votes: 23, status: 'In Progress' },
    { desc: 'Burst water pipe on Peradeniya road. Water wasted for 3 days.', category: 'Water', priority: 'Critical', votes: 41, status: 'Pending' },
    { desc: 'Illegal dumping site near the school. Foul smell affecting students.', category: 'Environment', priority: 'Medium', votes: 12, status: 'Resolved' },
  ];

  return (
    <div>
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>{t('home_title')}</h1>
        <p style={styles.heroSub}>{t('home_subtitle')}</p>
        <button style={styles.heroBtn} onClick={() => navigate('/submit')}>
          {t('home_report_btn')}
        </button>
      </div>

      <div style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>{t('home_features_title')}</h2>
        <div style={styles.features}>
          {features.map((f, i) => (
            <div key={i} style={styles.featureCard}>
              <div style={styles.featureIcon}>{f.icon}</div>
              <h3 style={styles.featureTitle}>{t(f.titleKey)}</h3>
              <p style={styles.featureDesc}>{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>{t('home_recent_title')}</h2>
        <div style={styles.complaintGrid}>
          {sampleComplaints.map((c, i) => (
            <SampleComplaint key={i} {...c} />
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  hero: { background: 'linear-gradient(135deg, #1A56DB 0%, #0E9F6E 100%)', padding: '80px 32px', textAlign: 'center', color: '#fff' },
  heroTitle: { fontSize: '36px', fontWeight: '800', maxWidth: '700px', margin: '0 auto 16px' },
  heroSub: { fontSize: '18px', opacity: 0.9, marginBottom: '32px' },
  heroBtn: { backgroundColor: '#fff', color: '#1A56DB', border: 'none', padding: '14px 32px', borderRadius: '8px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginTop: '16px' },
  featuresSection: { padding: '48px 32px 24px', textAlign: 'center' },
  features: { display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' },
  featureCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', textAlign: 'center', flex: '1', minWidth: '220px', maxWidth: '300px' },
  featureIcon: { fontSize: '36px', marginBottom: '12px' },
  featureTitle: { fontSize: '18px', fontWeight: '700', color: '#1A56DB', marginBottom: '8px' },
  featureDesc: { fontSize: '14px', color: '#6B7280', lineHeight: '1.6' },
  section: { padding: '0 32px 48px' },
  sectionTitle: { fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '20px' },
  complaintGrid: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  card: { backgroundColor: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flex: '1', minWidth: '240px' },
  cardTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
  category: { fontSize: '13px', color: '#1A56DB', fontWeight: '600' },
  priorityBadge: { fontSize: '12px', padding: '2px 10px', borderRadius: '20px', fontWeight: '600' },
  cardDesc: { fontSize: '14px', color: '#374151', marginBottom: '12px', lineHeight: '1.5' },
  cardBottom: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280' },
};

export default Home;