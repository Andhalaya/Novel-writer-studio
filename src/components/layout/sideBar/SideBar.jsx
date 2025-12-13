import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Database,
  FileText,
  Folder,
  LogOut,
} from "lucide-react";

import { useProject } from "../../../context/ProjectContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import "./SideBar.css";

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `sidebar-link ${isActive ? "active" : ""}`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  );
}

function SideBar() {
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
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="logo">NovelCraft</div>
        <span className="logo-sub">Creative Writing Studio</span>
      </div>

      {/* Project selector - only show if we have a project selected */}
      {isProjectSelected && (
        <select 
          className="project-select" 
          onChange={handleProjectChange}
          value={currentProject?.id || ""}
        >
          <option value="" disabled>Select Project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        <NavItem to="/" icon={Folder} label="Projects" />

        {isProjectSelected && currentProject && (
          <>
            <div className="divider" />
            <NavItem 
              to={`/project/${currentProject.id}/chapters`} 
              icon={BookOpen} 
              label="Chapters" 
            />
            <NavItem 
              to={`/project/${currentProject.id}/codex`} 
              icon={Database} 
              label="Codex" 
            />
            <NavItem 
              to={`/project/${currentProject.id}/manuscript`} 
              icon={FileText} 
              label="Manuscript" 
            />
          </>
        )}
      </nav>

      {/* User */}
      {user && (
        <div className="sidebar-user">
          <div className="avatar">{user.email?.[0]?.toUpperCase() || 'U'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name">{user.displayName || 'User'}</div>
            <div className="user-email">{user.email}</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="sidebar-link logout" onClick={handleLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default SideBar;