import Sidebar from "./sideBar/SideBar";
import React from "react";
import { useProject } from "../../context/ProjectContext";

function AppLayout({ children }) {
  const { currentProject } = useProject();

  return (
    <div className="app-shell">
      <div className="app-bar">
        {currentProject && (
          <div className="app-bar-content">
            <h1 className="app-bar-title">{currentProject.title}</h1>
          </div>
        )}
      </div>
      <Sidebar />
      <main className="app-main">{children}</main>
    </div>
  );
}

export { AppLayout };