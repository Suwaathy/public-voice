import React from "react";
import AdminSidebar from "./AdminSidebar";

function AdminLayout({ title, subtitle, children }) {
  return (
    <>
      <AdminSidebar />

      <div
        style={{
          marginLeft: "250px",
          marginTop: "64px",
          padding: "30px",
          minHeight: "calc(100vh - 64px)",
          background: "#f8fafc",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            marginBottom: "25px",
          }}
        >
          <h1
            style={{
              margin: 0,
              color: "#0f172a",
              fontSize: "28px",
            }}
          >
            {title}
          </h1>

          {subtitle && (
            <p
              style={{
                color: "#64748b",
                marginTop: "8px",
                fontSize: "15px",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </div>
    </>
  );
}

export default AdminLayout;