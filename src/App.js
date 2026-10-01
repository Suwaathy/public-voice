import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import "./i18n";

import { AuthProvider } from "./context/AuthContext";
import { TranslationProvider } from "./context/TranslationContext";

import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SubmitComplaint from "./pages/SubmitComplaint";
import MyComplaints from "./pages/MyComplaints";
import PublicFeed from "./pages/PublicFeed";

import AdminDashboard from "./pages/AdminDashboard";
import AdminComplaints from "./pages/AdminComplaints";
import AdminVerification from "./pages/AdminVerification";
import AdminFlagged from "./pages/AdminFlagged";
import AdminUsers from "./pages/AdminUsers";
import AdminVerifyComplaint from "./pages/AdminVerifyComplaint";
import AdminLogin from "./pages/AdminLogin";
import AdminAccess from "./pages/AdminAccess";

function AppContent() {
  const location = useLocation();

  // Hide Navbar on admin login and access-code pages (not on admin dashboard pages)
  const hideNavbar =
    location.pathname === "/secure-portal" ||
    location.pathname === "/admin/login";

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/" element={<Home />} />
        <Route path="/feed" element={<PublicFeed />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ================= USER ROUTES ================= */}
        <Route
          path="/submit"
          element={
            <PrivateRoute>
              <SubmitComplaint />
            </PrivateRoute>
          }
        />

        <Route
          path="/my-complaints"
          element={
            <PrivateRoute>
              <MyComplaints />
            </PrivateRoute>
          }
        />

        {/* ================= ADMIN ROUTES ================= */}

        <Route path="/secure-portal" element={<AdminAccess />} />

        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/complaints"
          element={
            <AdminRoute>
              <AdminComplaints />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/verification"
          element={
            <AdminRoute>
              <AdminVerification />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/flagged"
          element={
            <AdminRoute>
              <AdminFlagged />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/verify/:id"
          element={
            <AdminRoute>
              <AdminVerifyComplaint />
            </AdminRoute>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <TranslationProvider>
        <Router>
          <AppContent />
        </Router>
      </TranslationProvider>
    </AuthProvider>
  );
}

export default App;