import React from "react";
import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  // Admin pages rely on the admin JWT in localStorage.
  // Using the citizen/user role from AuthContext causes conflicts because both auth flows store in localStorage.token.
  const token = localStorage.getItem("adminToken");


  if (!token) return <Navigate to="/admin/login" />;

  // We don’t have a client-side way to verify JWT signature here.
  // Backend will enforce adminAuth for each admin endpoint.
  return children;

}

export default AdminRoute;