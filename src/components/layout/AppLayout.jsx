import Sidebar from "./sideBar/SideBar";
import React, { useState } from "react";
import { useProject } from "../../context/ProjectContext";
import { useTheme } from "../../context/ThemeContext";
import { Menu, Moon, Sun } from "lucide-react";

function AppLayout({ children }) {
  const { currentProject } = useProject();
  const { theme, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="app-shell">
      <div className="app-bar">
        <div className="app-bar-left">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <Menu size={20} />
          </button>
          {currentProject && (
            <div className="app-bar-content">
              <h1 className="app-bar-title">{currentProject.title}</h1>
              <p className="app-bar-subtitle">
                {currentProject.status || "Planning"} • {currentProject.goalWordCount?.toLocaleString() || 0} words goal
              </p>
            </div>
          )}
        </div>
        
        <button 
          className="theme-toggle"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
      <Sidebar collapsed={sidebarCollapsed} />
      <main className={`app-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {children}
      </main>
    </div>
  );
}

export { AppLayout };