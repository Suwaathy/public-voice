import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, admin, logout, logoutAdmin } = useAuth();

  // Admin is separate from user-auth, and this Navbar currently only checks `user`
  const isAuthed = Boolean(user || admin);
  const navigate = useNavigate();
  const [activeLang, setActiveLang] = useState('en');
  const [gtReady, setGtReady] = useState(false);

  // Detect current language from cookie on load
  useEffect(() => {
    const cookie = document.cookie
      .split(';')
      .find(c => c.trim().startsWith('googtrans='));
    if (cookie) {
      const val = cookie.split('=')[1]; // e.g. /en/ta
      const parts = val.split('/');
      const lang = parts[parts.length - 1];
      if (lang === 'ta') setActiveLang('ta');
      else if (lang === 'si') setActiveLang('si');
      else setActiveLang('en');
    }
  }, []);

  // Wait for Google Translate widget to load
  useEffect(() => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        setGtReady(true);
        clearInterval(interval);
        console.log('✅ Google Translate widget ready');
        return;
      }
      // After 20 attempts (10 seconds) just enable buttons anyway
      if (attempts >= 20) {
        setGtReady(true);
        clearInterval(interval);
        console.log('⚠️ GT widget not found — enabling buttons anyway (cookie method)');
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleLangChange = (langCode) => {
    if (langCode === activeLang) return;
    setActiveLang(langCode);
    if (window.doGoogleTranslate) {
      window.doGoogleTranslate(langCode);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const languages = [
    { code: 'en', label: 'EN', title: 'English' },
    { code: 'ta', label: 'TA', title: 'Tamil' },
    { code: 'si', label: 'SI', title: 'Sinhala' },
  ];

  // Detect if we are on an admin page (to render admin-specific navbar)
  const isAdminPage = window.location.pathname.startsWith('/admin') && admin && !user;

  return (
    <>
      <style>{`
        .goog-te-banner-frame { display: none !important; }
        .skiptranslate { display: none !important; }
        body { top: 0 !important; }
        #goog-gt-tt { display: none !important; }
        .goog-te-balloon-frame { display: none !important; }
        .goog-text-highlight { background: none !important; box-shadow: none !important; }
        .VIpgJd-ZVi9od-aZ2wEe-wOHMyf { display: none !important; }
        .VIpgJd-ZVi9od-aZ2wEe-OiiCO { display: none !important; }
      `}</style>

      <nav style={styles.nav}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>🗣️ Public Voice</Link>

        {isAdminPage ? (
          /* ===== ADMIN VIEW: Only logo + admin name + admin logout ===== */
          <div style={styles.right}>
            <div style={styles.userRow}>
              <span style={styles.userName}>👤 {admin.name || admin.email || 'Admin'}</span>
              <button
                onClick={() => {
                  sessionStorage.removeItem("adminAccess");
                  logoutAdmin();
                  navigate("/", { replace: true });
                }}
                style={{
                  ...styles.logoutBtn,
                  backgroundColor: '#DC2626',
                  color: '#fff',
                  border: 'none',
                }}
              >
                Admin Logout
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ===== NORMAL PUBLIC VIEW ===== */}
            {/* Nav Links */}
            <div style={styles.links}>
              <Link to="/" style={styles.link}>Home</Link>
              <Link to="/feed" style={styles.link}>Public Feed</Link>
              {user && (
                <>
                  <Link to="/my-complaints" style={styles.link}>My Complaints</Link>
                  <Link to="/submit" style={styles.link}>Submit Complaint</Link>
                </>
              )}
            </div>

            {/* Right side */}
            <div style={styles.right}>

              {/* Language Switcher */}
              <div style={styles.langBox}>
                <span style={{ fontSize: '14px' }}>🌐</span>
                <div style={styles.langSwitch}>
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => handleLangChange(lang.code)}
                      title={lang.title}
                      style={{
                        ...styles.langBtn,
                        backgroundColor: activeLang === lang.code ? '#1A56DB' : '#fff',
                        color: activeLang === lang.code ? '#fff' : '#1A56DB',
                        fontWeight: activeLang === lang.code ? '700' : '500',
                      }}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
                {!gtReady && <span style={{ fontSize: '11px', color: '#9CA3AF' }}>loading...</span>}
              </div>

              {/* Auth */}
              {isAuthed ? (
                admin && !user ? (
                  <div style={styles.userRow}>
                    <span style={styles.userName}>👤 {admin.name || admin.email || 'Admin'}</span>
                    <button
                      onClick={() => {
                        sessionStorage.removeItem("adminAccess");
                        logoutAdmin();
                        navigate("/", { replace: true });
                      }}
                      style={styles.logoutBtn}
                    >
                      Admin Logout
                    </button>
                  </div>
                ) : user ? (
                  <div style={styles.userRow}>
                    <span style={styles.userName}>👤 {user.name}</span>
                    <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
                  </div>
                ) : (
                  <div style={styles.authRow} />
                )
              ) : (
                <div style={styles.authRow}>
                  <Link to="/login" style={styles.loginBtn}>Login</Link>
                  <Link to="/register" style={styles.registerBtn}>Register</Link>
                </div>
              )}
            </div>
          </>
        )}
      </nav>
    </>
  );
};

const styles = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 32px', height: '64px', backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 1000,
  },
  logo: { fontSize: '20px', fontWeight: '800', color: '#1A56DB', textDecoration: 'none' },
  links: { display: 'flex', gap: '24px', alignItems: 'center' },
  link: { color: '#374151', textDecoration: 'none', fontSize: '14px', fontWeight: '500' },
  right: { display: 'flex', alignItems: 'center', gap: '14px' },
  langBox: { display: 'flex', alignItems: 'center', gap: '6px' },
  langSwitch: {
    display: 'flex', border: '1.5px solid #1A56DB',
    borderRadius: '8px', overflow: 'hidden',
  },
  langBtn: {
    padding: '5px 14px', border: 'none', cursor: 'pointer',
    fontSize: '12px', transition: 'all 0.2s',
  },
  userRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  userName: { fontSize: '13px', color: '#374151', fontWeight: '500' },
  logoutBtn: {
    padding: '7px 14px', borderRadius: '6px', border: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB', color: '#374151', fontSize: '13px', cursor: 'pointer',
  },
  authRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  loginBtn: {
    padding: '7px 16px', borderRadius: '6px', border: '1px solid #1A56DB',
    color: '#1A56DB', backgroundColor: 'transparent', textDecoration: 'none',
    fontSize: '13px', fontWeight: '600',
  },
  registerBtn: {
    padding: '7px 16px', borderRadius: '6px', border: 'none',
    color: '#fff', backgroundColor: '#1A56DB', textDecoration: 'none',
    fontSize: '13px', fontWeight: '600',
  },
};

export default Navbar;