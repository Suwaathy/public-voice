import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useAutoTranslate } from '../hooks/useAutoTranslate';

const Register = () => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', language: 'en' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const titleText = useAutoTranslate('Create Account');
  const namePlaceholder = useAutoTranslate('Full Name');
  const emailPlaceholder = useAutoTranslate('Email address');
  const passwordPlaceholder = useAutoTranslate('Password');
  const confirmPlaceholder = useAutoTranslate('Confirm Password');
  const langLabel = useAutoTranslate('Preferred Language');
  const registerBtnText = useAutoTranslate('Register');
  const haveAccountText = useAutoTranslate('Already have an account?');
  const loginLinkText = useAutoTranslate('Login');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(form.name, form.email, form.password, form.language);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.logo}>🗣️ Public Voice</h2>
        <h3 style={styles.sub}>{titleText}</h3>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>{t('name')}</label>
          <input name="name" placeholder={namePlaceholder} value={form.name} onChange={handleChange} style={styles.input} required />
          <label style={styles.label}>{t('email')}</label>
          <input name="email" type="email" placeholder={emailPlaceholder} value={form.email} onChange={handleChange} style={styles.input} required />
          <label style={styles.label}>{t('password')}</label>
          <input name="password" type="password" placeholder={passwordPlaceholder} value={form.password} onChange={handleChange} style={styles.input} required />
          <label style={styles.label}>{t('confirm_password')}</label>
          <input name="confirmPassword" type="password" placeholder={confirmPlaceholder} value={form.confirmPassword} onChange={handleChange} style={styles.input} required />
          <label style={styles.label}>{langLabel}</label>
          <select name="language" value={form.language} onChange={handleChange} style={styles.input}>
            <option value="en">English</option>
            <option value="ta">Tamil</option>
            <option value="si">Sinhala</option>
          </select>
          <button type="submit" style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? '...' : registerBtnText}
          </button>
        </form>
        <p style={styles.switch}>
          {haveAccountText}{' '}
          <Link to="/login" style={{ color: '#1A56DB' }}>{loginLinkText}</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  card: { backgroundColor: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '420px' },
  logo: { textAlign: 'center', color: '#1A56DB', marginBottom: '4px' },
  sub: { textAlign: 'center', color: '#374151', marginBottom: '24px', fontWeight: '500' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
  input: { width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '12px', backgroundColor: '#1A56DB', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  error: { color: '#DC2626', fontSize: '13px', marginBottom: '12px', backgroundColor: '#FEE2E2', padding: '10px', borderRadius: '6px' },
  switch: { textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#6B7280' },
};

export default Register;