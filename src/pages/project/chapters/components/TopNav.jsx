import React, { useState } from "react";
import { ChevronDown, Plus, PanelRightClose, PanelRightOpen } from "lucide-react";

export default function TopNav({
  selectedChapter,
  chapterNumber,
  chapters,
  setChapters,
  loadChapter,
  setScenes,
  setBeats,
  deleteChapter,
  createChapter,
  projectId,
  viewMode,
  setViewMode,
  handleAdd,
  addButtonText,
  outlineOpen,
  setOutlineOpen,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [chapterToDelete, setChapterToDelete] = useState(null);

  const handleSelectChapter = async (chapter) => {
    await loadChapter(chapter);
    setDropdownOpen(false);
  };

  const handleAddChapter = () => {
    const defaultTitle = `Chapter ${chapters.length + 1}`;
    setNewChapterTitle(defaultTitle);
    setShowChapterModal(true);
  };

  const handleCreateChapter = async () => {
    const title = newChapterTitle.trim();
    if (!title) {
      alert("Please enter a chapter title.");
      return;
    }
    try {
      const nextOrder =
        chapters.length > 0
          ? Math.max(...chapters.map((c) => c.orderIndex || 0)) + 1
          : 0;
      const newChapterData = { title, orderIndex: nextOrder };
      const docRef = await createChapter(projectId, newChapterData);
      const newChapter = { id: docRef.id, ...newChapterData };
      setChapters((prev) => [...prev, newChapter].sort((a, b) => a.orderIndex - b.orderIndex));
      setShowChapterModal(false);
      setNewChapterTitle("");
      await loadChapter(newChapter);
    } catch (error) {
      console.error("Error creating chapter:", error);
      alert("Could not create chapter. Please try again.");
    }
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
        className="add-chapter-btn"
        onClick={handleAddChapter}
      >
        + Add Chapter
      </div>
      <div className="add-btn" onClick={handleAdd}>
        <Plus size={18} />
        <span>{addButtonText}</span>
      </div>
      <div
        className="outline-toggle-btn"
        onClick={() => setOutlineOpen && setOutlineOpen((v) => !v)}
        title={outlineOpen ? "Hide outline" : "Show outline"}
      >
        {outlineOpen ? <PanelRightClose size={25} /> : <PanelRightOpen size={25} />}
      </div>

      {/* New Chapter Modal */}
      {showChapterModal && (
        <div className="chapter-modal-overlay" onClick={() => setShowChapterModal(false)}>
          <div className="chapter-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="chapter-modal-title">New Chapter</h3>
            <input
              className="chapter-modal-input"
              type="text"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="Chapter title"
              autoFocus
            />
            <div className="chapter-modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowChapterModal(false)}>
                Cancel
              </button>
              <button className="modal-btn primary" onClick={handleCreateChapter}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

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
