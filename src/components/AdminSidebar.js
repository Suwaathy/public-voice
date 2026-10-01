import React from "react";
import { Link } from "react-router-dom";
import "./AdminSidebar.css";

function AdminSidebar() {
  return (
    <div className="admin-sidebar">

      <h2>Public Voice</h2>

      <Link to="/admin">
        Admin Dashboard
      </Link>



      <Link to="/admin/complaints">
        Complaints
      </Link>

      <Link to="/admin/verification">
        Verification
      </Link>

      <Link to="/admin/flagged">
        Flagged
      </Link>

      <Link to="/admin/users">
        Users
      </Link>

    </div>
  );
}

export default AdminSidebar;