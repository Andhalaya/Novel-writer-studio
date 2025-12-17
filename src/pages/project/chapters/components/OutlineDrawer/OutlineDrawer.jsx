import React, { useState } from "react";
import { 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Link2, 
  Clock,
  CheckCircle2,
  Circle,
  Trash2,
  BookOpen,
  Edit2
} from "lucide-react";
import ChapterModal from "../NewChapterModal";
import './OutlineDrawer.css';

export default function OutlineDrawer({
  open,
  chapters,
  scenesByChapter,
  expandedMap,
  onToggleChapter,
  onDeleteChapter,
  onCreateChapter,
  onUpdateChapter,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);

  const handleEditChapter = (chapter) => {
    setEditingChapter(chapter);
    setModalOpen(true);
  };

  const handleCreateChapter = () => {
    setEditingChapter(null);
    setModalOpen(true);
  };

  const handleSaveChapter = async (data) => {
    try {
      if (editingChapter) {
        await onUpdateChapter(editingChapter.id, data);
      } else {
        await onCreateChapter(data);
      }
      setModalOpen(false);
      setEditingChapter(null);
    } catch (error) {
      console.error("Error saving chapter:", error);
      alert("Error saving chapter. Please try again.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "complete": return "bg-green-100 text-green-700 border-green-200";
      case "in-progress": return "bg-blue-100 text-blue-700 border-blue-200";
      case "draft": return "bg-gray-100 text-gray-600 border-gray-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "complete": return <CheckCircle2 size={14} />;
      case "in-progress": return <Clock size={14} />;
      default: return <Circle size={14} />;
    }
  };

  const calculateWordCount = (scenes) => {
    return scenes.reduce((total, scene) => {
      const text = scene.manuscriptText || scene.text || "";
      return total + text.split(/\s+/).filter(Boolean).length;
    }, 0);
  };

  const getCompletionPercentage = (chapter, scenes) => {
    if (!chapter.targetWordCount) return 0;
    const wordCount = calculateWordCount(scenes);
    return Math.min(100, Math.round((wordCount / chapter.targetWordCount) * 100));
  };

  const countLinkedBeats = (scenes, chapter) => {
    // This assumes you have a way to get beats for a chapter
    // You might need to pass beats data as well
    return scenes.filter(s => s.linkedBeatId).length;
  };

  const filteredChapters = chapters.filter(ch => 
    ch.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className={`outline-drawer ${open ? "open" : ""}`}>
        <div className="outline-header-section">
          <div className="outline-header-top">
            <div className="outline-title-with-icon">
              <BookOpen size={20} className="outline-icon" />
              <h2 className="outline-title">Book Outline</h2>
            </div>
            <button
              onClick={handleCreateChapter}
              className="new-chapter-btn"
            >
              New Chapter
            </button>
          </div>
          
          <input
            type="text"
            placeholder="Search chapters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="outline-search-input"
          />
        </div>

        {open && (
          <div className="outline-body">
            <div className="outline-list">
              {filteredChapters.length === 0 ? (
                <div className="outline-empty-state">
                  <BookOpen size={48} className="empty-icon" />
                  <p className="empty-text">No chapters found</p>
                </div>
              ) : (
                filteredChapters
                  .slice()
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((chapter, idx) => {
                    const expanded = expandedMap[chapter.id];
                    const scenes = scenesByChapter[chapter.id] || [];
                    const wordCount = calculateWordCount(scenes);
                    const completion = getCompletionPercentage(chapter, scenes);
                    const linkedBeatsCount = countLinkedBeats(scenes, chapter);

                    return (
                      <div key={chapter.id} className="outline-chapter-card">
                        <div className="chapter-card-content">
                          <div className="chapter-header-row">
                            <button
                              className="outline-caret-btn"
                              onClick={() => onToggleChapter(chapter)}
                              title={expanded ? "Collapse" : "Expand"}
                            >
                              {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                            
                            <div className="chapter-info">
                              <div className="chapter-meta-row">
                                <span className="chapter-number">Ch {idx + 1}</span>
                                <span className={`status-badge ${chapter.status || 'draft'}`}>
                                  {getStatusIcon(chapter.status || 'draft')}
                                  {chapter.status || 'draft'}
                                </span>
                              </div>
                              <h3 className="chapter-title">
                                {chapter.title || "Untitled Chapter"}
                              </h3>
                              {chapter.description && (
                                <p className="chapter-description">
                                  {chapter.description}
                                </p>
                              )}
                            </div>

                            <div className="chapter-actions">
                              <button 
                                onClick={() => handleEditChapter(chapter)}
                                className="action-btn edit-btn"
                                title="Edit chapter"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => onDeleteChapter(chapter)}
                                className="action-btn delete-btn"
                                title="Delete chapter"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="chapter-stats">
                            <span className="stat-item">
                              <FileText size={12} />
                              {scenes.length} scenes
                            </span>
                            <span className="stat-item">
                              <Link2 size={12} />
                              {linkedBeatsCount}/{chapter.beats?.length || 0} beats
                            </span>
                            <span className="stat-item">
                              {wordCount.toLocaleString()} words
                            </span>
                          </div>

                          {chapter.targetWordCount > 0 && (
                            <div className="progress-section">
                              <div className="progress-label">
                                <span>Progress</span>
                                <span>{completion}%</span>
                              </div>
                              <div className="progress-bar">
                                <div 
                                  className={`progress-fill ${completion === 100 ? 'complete' : ''}`}
                                  style={{ width: `${completion}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="chapter-timestamp">
                            <Clock size={11} />
                            Last edited: {new Date(chapter.updatedAt || chapter.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {expanded && scenes.length > 0 && (
                          <div className="scenes-list-section">
                            <ul className="scenes-list">
                              {scenes
                                .slice()
                                .sort((a, b) => a.orderIndex - b.orderIndex)
                                .map((scene, sidx) => {
                                  const sceneWordCount = (scene.manuscriptText || scene.text || "")
                                    .split(/\s+/)
                                    .filter(Boolean).length;
                                  
                                  return (
                                    <li key={scene.id} className="scene-item">
                                      <div className="scene-dot" />
                                      <span className="scene-title">
                                        Scene {sidx + 1}: {scene.title || "Untitled Scene"}
                                      </span>
                                      
                                      <div className="scene-badges">
                                        {scene.versions && scene.versions.length > 0 && (
                                          <span className="badge version-badge">
                                            v{scene.versions.length + 1}
                                          </span>
                                        )}
                                        {scene.linkedBeatId && (
                                          <Link2 size={12} className="icon-badge link-icon" />
                                        )}
                                        {scene.manuscriptText && (
                                          <CheckCircle2 size={12} className="icon-badge manuscript-icon" />
                                        )}
                                      </div>
                                      
                                      <span className="scene-word-count">
                                        {sceneWordCount.toLocaleString()}w
                                      </span>
                                    </li>
                                  );
                                })}
                            </ul>
                          </div>
                        )}

                        {expanded && scenes.length === 0 && (
                          <div className="scenes-empty-state">
                            <p>No scenes yet</p>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>

            <div className="outline-footer">
              <div className="footer-stat">
                <span>Total Chapters:</span>
                <span className="stat-value">{chapters.length}</span>
              </div>
              <div className="footer-stat">
                <span>Total Scenes:</span>
                <span className="stat-value">
                  {Object.values(scenesByChapter).reduce((sum, scenes) => sum + scenes.length, 0)}
                </span>
              </div>
              <div className="footer-stat">
                <span>Total Words:</span>
                <span className="stat-value">
                  {Object.values(scenesByChapter)
                    .reduce((sum, scenes) => sum + calculateWordCount(scenes), 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <ChapterModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingChapter(null);
        }}
        chapter={editingChapter}
        onSave={handleSaveChapter}
      />
    </>
  );
}