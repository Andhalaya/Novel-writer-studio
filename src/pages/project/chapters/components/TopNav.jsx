import React, { useState } from "react";
import { ChevronDown, PanelRightClose, PanelRightOpen, Plus } from "lucide-react";

export default function TopNav({
  selectedChapter,
  chapterNumber,
  chapters,
  setChapters,
  loadChapter,
  setScenes,
  setBeats,
  deleteChapter,
  projectId,
  viewMode,
  setViewMode,
  handleAddScene,
  handleAddBeat,
  handleAddSceneAndBeatPair,
  outlineOpen,
  setOutlineOpen,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState(null);

  const handleSelectChapter = async (chapter) => {
    await loadChapter(chapter);
    setDropdownOpen(false);
  };

  const openDeleteModal = () => {
    if (!selectedChapter) return;
    setChapterToDelete(selectedChapter);
  };

  const handleConfirmDeleteChapter = async () => {
    if (!chapterToDelete) return;
    try {
      await deleteChapter(projectId, chapterToDelete.id);
      const remaining = chapters.filter((c) => c.id !== chapterToDelete.id);
      setChapters(remaining);
      setChapterToDelete(null);
      if (selectedChapter?.id === chapterToDelete.id) {
        if (remaining.length) {
          await loadChapter(remaining[0]);
        } else {
          setScenes([]);
          setBeats([]);
        }
      }
    } catch (error) {
      console.error("Error deleting chapter:", error);
      alert("Could not delete chapter. Please try again.");
    }
  };

  const getAddButtonText = () => {
    switch (viewMode) {
      case "both":
        return "Add Scene & Beat Pair";
      case "scenes":
        return "Add Scene";
      case "beats":
        return "Add Beat";
      default:
        return "Add";
    }
  };

  const handleAdd = () => {
    if (viewMode === "scenes") {
      handleAddScene();
    } else if (viewMode === "beats") {
      handleAddBeat();
    } else {
      handleAddSceneAndBeatPair();
    }
  };

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
                onClick={() => handleSelectChapter(chapter)}
              >
                <div className="chapter-dropdown-title">{chapter.title}</div>
                <div className="chapter-dropdown-meta">
                  {chapter.scenes?.length || 0} scenes · {chapter.beats?.length || 0} beats
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
      <div
        className="outline-toggle-btn"
        onClick={() => setOutlineOpen && setOutlineOpen((v) => !v)}
        title={outlineOpen ? "Hide outline" : "Show outline"}
      >
        {outlineOpen ? <PanelRightClose size={25} /> : <PanelRightOpen size={25} />}
      </div>

      {/* Delete Chapter Modal */}
      {chapterToDelete && (
        <div className="chapter-modal-overlay" onClick={() => setChapterToDelete(null)}>
          <div className="chapter-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="chapter-modal-title">Delete Chapter</h3>
            <p>Are you sure you want to delete "{chapterToDelete.title}"?</p>
            <div className="chapter-modal-actions">
              <button className="modal-btn cancel" onClick={() => setChapterToDelete(null)}>
                Cancel
              </button>
              <button className="modal-btn danger" onClick={handleConfirmDeleteChapter}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
