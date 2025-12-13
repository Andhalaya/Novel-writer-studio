import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Database,
  FileText,
  Folder,
  LogOut,
  LayoutDashboard,
} from "lucide-react";

import { useProject } from "../../../context/ProjectContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import "./SideBar.css";

function NavItem({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `sidebar-link ${isActive ? "active" : ""}`
      }
    >
      <Icon size={18} />
      {!collapsed && <span className="sidebar-link-label">{label}</span>}
    </NavLink>
  );
}

function SideBar({ collapsed }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currentProject, projects, selectProject, isProjectSelected } = useProject();

  const handleProjectChange = (e) => {
    const id = e.target.value;
    selectProject(id);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      {collapsed ? (
        <div className="sidebar-header">
          <div className="logo">✒️</div>
        </div>
      ) : (
        <div className="sidebar-header">
          <div className="logo">✒️</div>
          <div> 
            <div className="app-title">NovelCraft</div>
            <span className="app-subtitle">Creative Writing Studio</span>
          </div>
        </div>
      )}

      {/* Project selector - only show if we have a project selected */}
      {isProjectSelected && !collapsed && (
        <select 
          className="project-select" 
          onChange={handleProjectChange}
          value={currentProject?.id || ""}
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        <NavItem to="/" icon={Folder} label="Projects" collapsed={collapsed} />

        {isProjectSelected && currentProject && (
          <>
            <div className="divider" />
            <NavItem 
              to={`/dashboard/${currentProject.id}`} 
              icon={LayoutDashboard} 
              label="Dashboard"
              collapsed={collapsed}
            />
            <NavItem 
              to={`/project/${currentProject.id}/chapters`} 
              icon={BookOpen} 
              label="Chapters"
              collapsed={collapsed}
            />
            <NavItem 
              to={`/project/${currentProject.id}/codex`} 
              icon={Database} 
              label="Codex"
              collapsed={collapsed}
            />
            <NavItem 
              to={`/project/${currentProject.id}/manuscript`} 
              icon={FileText} 
              label="Manuscript"
              collapsed={collapsed}
            />
          </>
        )}
      </nav>

      {/* User */}
      {user && (
        <div className="sidebar-user">
          <div className="avatar">{user.email?.[0]?.toUpperCase() || 'U'}</div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name">{user.displayName || 'User'}</div>
              <div className="user-email">{user.email}</div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="sidebar-link logout" onClick={handleLogout}>
          <LogOut size={18} />
          {!collapsed && <span className="sidebar-link-label">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export default SideBar;