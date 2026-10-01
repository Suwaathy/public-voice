import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { useAuth } from "../context/AuthContext";

function AdminLogin() {
  const navigate = useNavigate();
  const { setAdmin, clearUser } = useAuth();
  useEffect(() => {

    if (sessionStorage.getItem("adminAccess") !== "true") {

        navigate("/");

    }

}, [navigate]);

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 🚨 NEW STATE: Tracks visibility of admin password characters
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/admin/login', {
        email: form.email,
        password: form.password,
      });

      // Clear any lingering user session so admin never sees user UI
      clearUser();

      // Backend returns { token, admin: {...} }
      localStorage.setItem("adminToken", res.data.token);
localStorage.setItem("admin", JSON.stringify(res.data.admin));

setAdmin(res.data.admin);

navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminSidebar />
      <div
        style={{
          marginLeft: '270px',
          minHeight: 'calc(100vh - 64px)',
          padding: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 55%)',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 440,
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 10px 25px rgba(2,6,23,0.08)',
            border: '1px solid rgba(15,23,42,0.06)',
            padding: 24,
          }}
        >
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: 24 }}>Admin Login</h2>
          <div style={{ marginTop: 8, color: '#64748b', fontWeight: 600 }}>
            Access the admin dashboard
          </div>

          {error && (
            <div
              style={{
                marginTop: 14,
                background: '#FEE2E2',
                color: '#DC2626',
                padding: '10px 12px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ marginTop: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 10,
                border: '1px solid #D1D5DB',
                marginBottom: 14,
                boxSizing: 'border-box',
              }}
            />

            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              Password
            </label>
            
            {/* 🚨 EDIT HERE: Added absolute tracking positioning box wrapper */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', marginBottom: 18 }}>
              <input
                name="password"
                type={showPassword ? "text" : "password"} // Switches inputs types on toggle clicks
                value={form.password}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 12px', // Added 42px right-padding buffer so text won't slide under icon
                  borderRadius: 10,
                  border: '1px solid #D1D5DB',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              
              {/* Eye Button Element */}
              <button
                type="button" // Stops the form from auto-submitting on toggle click
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6B7280',
                  padding: 0,
                  userSelect: 'none'
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  /* Hide/Slash Eye Icon SVG Vector */
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 18, height: 18 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  /* Open View Eye Icon SVG Vector */
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 18, height: 18 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 10,
                border: 'none',
                background: '#1A56DB',
                color: '#fff',
                fontWeight: 900,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div style={{ marginTop: 14, fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
            Enter admin credentials to access the dashboard.
          </div>

        </div>
      </div>
    </>
  );
}

export default AdminLogin;