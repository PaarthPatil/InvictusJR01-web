import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./DashboardLayout.css";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/components", label: "Components" },
  { to: "/pcbs", label: "PCBs" },
  { to: "/production", label: "Production" },
  { to: "/analytics", label: "Analytics" },
  { to: "/import-export", label: "Import/Export" },
];

function DashboardLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>PCB Inventory Automation</h2>
        <nav>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-actions">
          <button className="btn btn-outline" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div>
            <strong>{user?.email}</strong>
          </div>
          <div>
            Role: <strong>{user?.role || "Unknown"}</strong>
            {!isAdmin ? " (Read Only)" : ""}
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}

export default DashboardLayout;
