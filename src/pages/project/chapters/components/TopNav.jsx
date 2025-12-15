import React from "react";
import { ChevronDown, Plus } from "lucide-react";

export default function TopNav({
  selectedChapter,
  chapterNumber,
  dropdownOpen,
  setDropdownOpen,
  chapters,
  onSelectChapter,
  viewMode,
  setViewMode,
  handleAdd,
  addButtonText,
}) {
  return (
    <div className="top-nav">
      <div className="chapter-selector">
        <button
          className="chapter-dropdown-btn"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <span>
            {selectedChapter ? `Chapter ${chapterNumber}` : "Select a chapter"}
          </span>
          <ChevronDown size={16} />
        </button>

        {dropdownOpen && (
          <div className="chapter-dropdown">
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                className={`chapter-dropdown-item ${selectedChapter?.id === chapter.id ? "active" : ""}`}
                onClick={() => {
                  onSelectChapter(chapter);
                  setDropdownOpen(false);
                }}
              >
                <div className="chapter-dropdown-title">{chapter.title}</div>
                <div className="chapter-dropdown-meta">
                  {chapter.scenes?.length || 0} scenes ƒ?› {chapter.beats?.length || 0} beats
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="view-toggle">
        <button
          className={`view-toggle-btn ${viewMode === "both" ? "active" : ""}`}
          onClick={() => setViewMode("both")}
        >
          Both
        </button>
        <button
          className={`view-toggle-btn ${viewMode === "scenes" ? "active" : ""}`}
          onClick={() => setViewMode("scenes")}
        >
          Scenes
        </button>
        <button
          className={`view-toggle-btn ${viewMode === "beats" ? "active" : ""}`}
          onClick={() => setViewMode("beats")}
        >
          Beats
        </button>
      </div>

      <div className="nav-spacer" />

      <button className="add-btn" onClick={handleAdd}>
        <Plus size={18} />
        <span>{addButtonText}</span>
      </button>
    </div>
  );
}
