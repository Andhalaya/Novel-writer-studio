import React, { useState, useEffect } from "react";
import "./ChaptersView.css";
import { useParams } from "react-router-dom";
import { useFirestore } from "../../../context/FirestoreContext";
import {
  ChevronDown,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
} from "lucide-react";
// import NewSceneModal from "../../../components/ui/NewSceneModal/NewSceneModal";
// import NewBeatModal from "../../../components/ui/NewBeatModal/NewBeatModal";

export default function ChaptersView() {
  const { projectId } = useParams();
  const {
    getChapters,
    getBeats,
    getScenes,
    updateBeat,
    updateScene,
    deleteScene,
    deleteBeat,
  } = useFirestore();

  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [beats, setBeats] = useState([]);
  const [viewMode, setViewMode] = useState("both"); // 'both', 'scenes', 'beats'
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSceneModal, setShowSceneModal] = useState(false);
  const [showBeatModal, setShowBeatModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // { type: 'scene'/'beat', id: '...' }

  // Editor state
  const [editorTitle, setEditorTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorType, setEditorType] = useState(null); // 'scene' or 'beat'
  const [editorId, setEditorId] = useState(null);

  useEffect(() => {
    loadChapters();
  }, [projectId]);

  const loadChapters = async () => {
    const chaptersData = await getChapters(projectId);
    setChapters(chaptersData);
    if (chaptersData.length > 0 && !selectedChapter) {
      loadChapter(chaptersData[0]);
    }
  };

  const loadChapter = async (chapter) => {
    setSelectedChapter(chapter);
    const [scenesData, beatsData] = await Promise.all([
      getScenes(projectId, chapter.id),
      getBeats(projectId, chapter.id),
    ]);
    setScenes(scenesData);
    setBeats(beatsData);
    
    // Clear editor if switching chapters
    setEditingItem(null);
    setEditorType(null);
  };

  const loadIntoEditor = (type, item) => {
    setEditorType(type);
    setEditorId(item.id);
    setEditorTitle(item.title || (type === 'scene' ? 'Untitled Scene' : 'Untitled Beat'));
    setEditorContent(type === 'scene' ? item.text || '' : item.description || '');
    setEditingItem({ type, id: item.id });
  };

  const saveEditor = async () => {
    if (!editorType || !editorId) return;

    if (editorType === 'scene') {
      await updateScene(projectId, selectedChapter.id, editorId, {
        text: editorContent,
        title: editorTitle,
      });
      setScenes((prev) =>
        prev.map((s) =>
          s.id === editorId ? { ...s, text: editorContent, title: editorTitle } : s
        )
      );
    } else {
      await updateBeat(projectId, selectedChapter.id, editorId, {
        description: editorContent,
        title: editorTitle,
      });
      setBeats((prev) =>
        prev.map((b) =>
          b.id === editorId ? { ...b, description: editorContent, title: editorTitle } : b
        )
      );
    }
  };

  const handleDeleteItem = async (type, id) => {
    if (!window.confirm(`Delete this ${type}?`)) return;

    if (type === 'scene') {
      await deleteScene(projectId, selectedChapter.id, id);
      setScenes((prev) => prev.filter((s) => s.id !== id));
    } else {
      await deleteBeat(projectId, selectedChapter.id, id);
      setBeats((prev) => prev.filter((b) => b.id !== id));
    }

    // Clear editor if deleting current item
    if (editorId === id) {
      setEditorType(null);
      setEditorId(null);
      setEditingItem(null);
    }
  };

  const getPairs = () => {
    const maxLength = Math.max(scenes.length, beats.length);
    return Array.from({ length: maxLength }, (_, i) => ({
      scene: scenes[i] || null,
      beat: beats[i] || null,
    }));
  };

  const getAddButtonText = () => {
    switch (viewMode) {
      case 'both':
        return 'Add Scene & Beat Pair';
      case 'scenes':
        return 'Add Scene';
      case 'beats':
        return 'Add Beat';
      default:
        return 'Add';
    }
  };

  const handleAdd = () => {
    if (viewMode === 'scenes' || viewMode === 'both') {
      setShowSceneModal(true);
    }
    if (viewMode === 'beats') {
      setShowBeatModal(true);
    }
  };

  const renderCards = () => {
    if (viewMode === 'both') {
      const pairs = getPairs();
      return pairs.map((pair, index) => (
        <div key={index} className="content-card">
          {pair.scene ? (
            <SceneSection
              scene={pair.scene}
              isEditing={editingItem?.type === 'scene' && editingItem?.id === pair.scene.id}
              onEdit={() => loadIntoEditor('scene', pair.scene)}
              onDelete={() => handleDeleteItem('scene', pair.scene.id)}
            />
          ) : (
            <div className="card-section empty-section">
              <button className="add-empty-btn" 
              // onClick={() => setShowSceneModal(true)}
              >
                <Plus size={18} />
                <span>Add Scene</span>
              </button>
            </div>
          )}

          {pair.beat ? (
            <BeatSection
              beat={pair.beat}
              isEditing={editingItem?.type === 'beat' && editingItem?.id === pair.beat.id}
              onEdit={() => loadIntoEditor('beat', pair.beat)}
              onDelete={() => handleDeleteItem('beat', pair.beat.id)}
            />
          ) : (
            <div className="card-section empty-section">
              <button className="add-empty-btn"
              //  onClick={() => setShowBeatModal(true)}
               >
                <Plus size={18} />
                <span>Add Beat</span>
              </button>
            </div>
          )}
        </div>
      ));
    } else if (viewMode === 'scenes') {
      return scenes.map((scene) => (
        <div key={scene.id} className="content-card">
          <SceneSection
            scene={scene}
            isEditing={editingItem?.type === 'scene' && editingItem?.id === scene.id}
            onEdit={() => loadIntoEditor('scene', scene)}
            onDelete={() => handleDeleteItem('scene', scene.id)}
          />
        </div>
      ));
    } else {
      return beats.map((beat) => (
        <div key={beat.id} className="content-card">
          <BeatSection
            beat={beat}
            isEditing={editingItem?.type === 'beat' && editingItem?.id === beat.id}
            onEdit={() => loadIntoEditor('beat', beat)}
            onDelete={() => handleDeleteItem('beat', beat.id)}
          />
        </div>
      ));
    }
  };

  return (
    <div className="chapters-view-container">
      {/* Top Navigation */}
      <div className="top-nav">
        {/* Chapter Selector */}
        <div className="chapter-selector">
          <button
            className="chapter-dropdown-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span>
              {selectedChapter
                ? selectedChapter.title
                : "Select a chapter"}
            </span>
            <ChevronDown size={16} />
          </button>

          {dropdownOpen && (
            <div className="chapter-dropdown">
              {chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className={`chapter-dropdown-item ${
                    selectedChapter?.id === chapter.id ? "active" : ""
                  }`}
                  onClick={() => {
                    loadChapter(chapter);
                    setDropdownOpen(false);
                  }}
                >
                  <div className="chapter-dropdown-title">{chapter.title}</div>
                  <div className="chapter-dropdown-meta">
                    {chapter.scenes?.length || 0} scenes •{" "}
                    {chapter.beats?.length || 0} beats
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* View Toggle */}
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

        {/* Add Button */}
        <button className="add-btn" onClick={handleAdd}>
          <Plus size={18} />
          <span>{getAddButtonText()}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Cards Panel */}
        <div className="cards-panel">
          {!selectedChapter ? (
            <div className="empty-state">
              <div className="empty-icon">📖</div>
              <p className="empty-text">Select a chapter to begin</p>
            </div>
          ) : scenes.length === 0 && beats.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✨</div>
              <p className="empty-text">No scenes or beats yet</p>
              <p className="empty-hint">Click "Add Scene & Beat Pair" to start</p>
            </div>
          ) : (
            renderCards()
          )}
        </div>

        {/* Editor Panel */}
        <div className="editor-panel">
          {!editorType ? (
            <div className="editor-empty">
              <div className="editor-empty-icon">📝</div>
              <p className="editor-empty-text">Select a scene or beat to edit</p>
            </div>
          ) : (
            <>
              <div className="editor-header">
                <div className="editor-type-label" data-type={editorType}>
                  {editorType === 'scene' ? '📄 Scene' : '⚡ Beat'}
                </div>
                <input
                  type="text"
                  className="editor-title-input"
                  value={editorTitle}
                  onChange={(e) => setEditorTitle(e.target.value)}
                  onBlur={saveEditor}
                  placeholder={`${editorType === 'scene' ? 'Scene' : 'Beat'} title...`}
                />
                <div className="editor-toolbar">
                  <button className="toolbar-btn" onClick={saveEditor}>
                    💾 Save
                  </button>
                  <button
                    className="toolbar-btn delete"
                    onClick={() => handleDeleteItem(editorType, editorId)}
                  >
                    🗑️ Delete
                  </button>
                  <div className="save-status">● Auto-saved</div>
                </div>
              </div>

              <div className="editor-content">
                <textarea
                  className="editor-textarea"
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  onBlur={saveEditor}
                  placeholder={`Write your ${editorType} here...`}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {/* <NewSceneModal
        open={showSceneModal}
        onClose={() => setShowSceneModal(false)}
        chapterId={selectedChapter?.id}
        onCreated={() => selectedChapter && loadChapter(selectedChapter)}
      />

      <NewBeatModal
        open={showBeatModal}
        onClose={() => setShowBeatModal(false)}
        onCreated={() => selectedChapter && loadChapter(selectedChapter)}
      /> */}
    </div>
  );
}

// Scene Section Component
function SceneSection({ scene, isEditing, onEdit, onDelete }) {
  return (
    <div
      className={`card-section scene ${isEditing ? "editing" : ""}`}
      onClick={onEdit}
    >
      <div className="card-type-label scene">📄 Scene</div>
      <div className="card-header">
        <div className="card-title">
          <div className="card-title-text">{scene.title || "Untitled Scene"}</div>
          {scene.location && (
            <div className="card-meta">{scene.location} • {scene.time || 'Unspecified time'}</div>
          )}
        </div>
        <button
          className="card-menu-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="card-content">
        {scene.text || "No content yet..."}
      </div>
      {scene.tags && scene.tags.length > 0 && (
        <div className="card-tags">
          {scene.tags.map((tag, i) => (
            <span key={i} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Beat Section Component
function BeatSection({ beat, isEditing, onEdit, onDelete }) {
  return (
    <div
      className={`card-section beat ${isEditing ? "editing" : ""}`}
      onClick={onEdit}
    >
      <div className="card-type-label beat">⚡ Beat</div>
      <div className="card-header">
        <div className="card-title">
          <div className="card-title-text">{beat.title || "Untitled Beat"}</div>
          <div className="card-meta">Story beat</div>
        </div>
        <button
          className="card-menu-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="card-content">
        {beat.description || "No content yet..."}
      </div>
      {beat.tags && beat.tags.length > 0 && (
        <div className="card-tags">
          {beat.tags.map((tag, i) => (
            <span key={i} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}