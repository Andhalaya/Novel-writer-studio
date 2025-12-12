import React from "react";
import "./Header.css";
import { ChevronLeft, ChevronRight } from "lucide-react";

function Header({ sidebarCollapsed, setSidebarCollapsed }) {
  return (
    <header className="app-header">
      <button
        className="header-collapse-btn"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      >
        {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      <h1 className="header-title">Writer Studio</h1>
    </header>
  );
}

export default Header;
