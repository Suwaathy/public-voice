import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

axios.defaults.baseURL = 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [admin, setAdmin] = useState(JSON.parse(localStorage.getItem('admin')) || null);

  const logoutAdmin = () => {
  localStorage.removeItem("admin");
  localStorage.removeItem("adminToken");
  sessionStorage.removeItem("adminAccess");

  delete axios.defaults.headers.common["Authorization"];

  setAdmin(null);
};

  const clearUser = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };



  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem('user', JSON.stringify(res.data.user));
    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password, language) => {
    const res = await axios.post('/api/auth/register', { name, email, password, language });
    localStorage.setItem('user', JSON.stringify(res.data.user));
    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Set token on app load
  const token = localStorage.getItem('token');
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  return (
    <AuthContext.Provider value={{ user, admin: admin || null, login, register, logout, logoutAdmin, clearUser, setAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => useContext(AuthContext);