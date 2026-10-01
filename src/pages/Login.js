import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useAutoTranslate } from '../hooks/useAutoTranslate';

const Login = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 🚨 NEW STATE: Tracks visibility of password characters
  const [showPassword, setShowPassword] = useState(false);

  const titleText = useAutoTranslate('Welcome Back');
  const emailPlaceholder = useAutoTranslate('Email address');
  const passwordPlaceholder = useAutoTranslate('Password');
  const loginBtnText = useAutoTranslate('Login');
  const noAccountText = useAutoTranslate("Don't have an account?");
  const registerLinkText = useAutoTranslate('Register');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
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
          <label style={styles.label}>{t('email')}</label>
          <input 
            name="email" 
            type="email" 
            placeholder={emailPlaceholder}
            value={form.email} 
            onChange={handleChange} 
            style={styles.input} 
            required 
          />
          
          <label style={styles.label}>{t('password')}</label>
          
          {/* 🚨 EDIT HERE: Relative structural container for eye icon placement */}
          <div style={styles.passwordContainer}>
            <input 
              name="password" 
              type={showPassword ? "text" : "password"} // Switches input mode dynamically
              placeholder={passwordPlaceholder}
              value={form.password} 
              onChange={handleChange} 
              style={styles.passwordInput} 
              required 
            />
            
            {/* Interactive Eye Button element */}
            <button
              type="button" // Critical: stops form auto-submissions on click
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                /* Slashed Eye SVG Vector (Hide status) */
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                /* Open Eye SVG Vector (Show status) */
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>

          <button type="submit" style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? '...' : loginBtnText}
          </button>
        </form>
        
        <p style={styles.switch}>
          {noAccountText}{' '}
          <Link to="/register" style={{ color: '#1A56DB' }}>{registerLinkText}</Link>
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
  
  // 🚨 NEW STYLES: Handles password wrapper stack alignment
  passwordContainer: { position: 'relative', display: 'flex', alignItems: 'center', width: '100%', marginBottom: '16px' },
  passwordInput: { width: '100%', padding: '12px 42px 12px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  eyeButton: { position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', padding: 0, userSelect: 'none' },
  
  btn: { width: '100%', padding: '12px', backgroundColor: '#1A56DB', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  error: { color: '#DC2626', fontSize: '13px', marginBottom: '12px', backgroundColor: '#FEE2E2', padding: '10px', borderRadius: '6px' },
  switch: { textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#6B7280' },
};

export default Login;