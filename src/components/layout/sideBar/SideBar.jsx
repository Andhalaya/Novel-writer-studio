import React, { useState } from "react";
import "./SideBar.css";
import { NavLink, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

import { 
  BookOpen, 
  Layers, 
  FileText, 
  Archive, 
  LogOut, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";

function SideBar({ collapsed }) {
  const { user, logout } = useAuth();
  const { projectId } = useParams();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      
      {/* Header */}
      <div className="sidebar-top">
        {!collapsed && <h2 className="sidebar-title">Writer Studio</h2>}
      </div>

      {/* User section */}
      {!collapsed && user && (
        <p className="sidebar-user">{user.email}</p>
      )}

      {/* Navigation */}
      <nav className="sidebar-menu">

        <NavItem
          to="/dashboard"
          collapsed={collapsed}
          icon={<BookOpen size={20} />}
          label="Projects"
        />

        {projectId && (
          <>
            {!collapsed && <div className="sidebar-section">Current Project</div>}

            <NavItem
              to={`/project/${projectId}/chapters`}
              collapsed={collapsed}
              icon={<Layers size={20} />}
              label="Chapters"
            />

            <NavItem
              to={`/project/${projectId}/codex`}
              collapsed={collapsed}
              icon={<Archive size={20} />}
              label="Codex"
            />

            <NavItem
              to={`/project/${projectId}/manuscript`}
              collapsed={collapsed}
              icon={<FileText size={20} />}
              label="Manuscript"
            />
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

    </aside>
  );
}

export default SideBar;

/* ------------------------------------------
   Subcomponent: NavItem
------------------------------------------- */

function NavItem({ to, icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        isActive ? "sidebar-item active" : "sidebar-item"
      }
    >
      {icon}
      {!collapsed && <span className="item-label">{label}</span>}

      {/* Tooltip for collapsed mode */}
      {collapsed && (
        <div className="sidebar-tooltip">{label}</div>
      )}
    </NavLink>
  );
}
