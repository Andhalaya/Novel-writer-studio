import React, { useState, useEffect } from "react";
import "./ChaptersView.css";
import { useParams } from "react-router-dom";
import { useFirestore } from "../../../context/FirestoreContext";
import {
  ChevronDown,
  Plus,
  Trash2,
  Link as LinkIcon,
  Unlink,
} from "lucide-react";

export default function ChaptersView() {
  const { projectId } = useParams();
  const {
    getChapters,
    getBeats,
    getScenes,
    updateBeat,
    updateScene,
    updateChapter,
    deleteScene,
    deleteBeat,
    linkBeatToScene,
    unlinkBeat,
    reorderScenesWithBeats,
  } = useFirestore();

  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [beats, setBeats] = useState([]);
  const [viewMode, setViewMode] = useState("both");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSceneModal, setShowSceneModal] = useState(false);
  const [showBeatModal, setShowBeatModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [chapterTitleDraft, setChapterTitleDraft] = useState("");
  const [showLinkSelector, setShowLinkSelector] = useState(null); // { beatId: string }

  // Editor state
  const [editorTitle, setEditorTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorType, setEditorType] = useState(null);
  const [editorId, setEditorId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");

  useEffect(() => {
    loadChapters();
  }, [projectId]);

  useEffect(() => {
    if (!editorType || !editorId || !selectedChapter) return;

    const interval = setInterval(async () => {
      if (!isDirty) return;

      if (editorType === "scene") {
        await updateScene(projectId, selectedChapter.id, editorId, {
          text: editorContent,
          title: editorTitle,
        });

        setScenes((prev) =>
          prev.map((s) =>
            s.id === editorId
              ? { ...s, text: editorContent, title: editorTitle }
              : s
          )
        );
      } else {
        await updateBeat(projectId, selectedChapter.id, editorId, {
          description: editorContent,
          title: editorTitle,
        });

        setBeats((prev) =>
          prev.map((b) =>
            b.id === editorId
              ? { ...b, description: editorContent, title: editorTitle }
              : b
          )
        );
      }

      setIsDirty(false);
      setSaveStatus("autosaved");
    }, 10000);

    return () => clearInterval(interval);
  }, [
    editorType,
    editorId,
    selectedChapter?.id,
    isDirty,
    editorTitle,
    editorContent,
    projectId,
  ]);

  const loadChapters = async () => {
    const chaptersData = await getChapters(projectId);
    setChapters(chaptersData);
    if (chaptersData.length > 0 && !selectedChapter) {
      loadChapter(chaptersData[0]);
    }
  };

  const chapterNumber = selectedChapter
    ? chapters
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .findIndex((c) => c.id === selectedChapter.id) + 1
    : null;

  const loadChapter = async (chapter) => {
    setSelectedChapter(chapter);
    setChapterTitleDraft(chapter.title);

    const [scenesData, beatsData] = await Promise.all([
      getScenes(projectId, chapter.id),
      getBeats(projectId, chapter.id),
    ]);

    setScenes(scenesData);
    setBeats(beatsData);

    setEditingItem(null);
    setEditorType(null);
  };

  const loadIntoEditor = (type, item) => {
    setEditorType(type);
    setEditorId(item.id);
    setEditorTitle(
      item.title || (type === "scene" ? "Untitled Scene" : "Untitled Beat")
    );
    setEditorContent(type === "scene" ? item.text || "" : item.description || "");
    setEditingItem({ type, id: item.id });
    setIsDirty(false);
    setSaveStatus("idle");
  };

  const saveEditor = async () => {
    if (!editorType || !editorId) return;

    if (editorType === "scene") {
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

    setIsDirty(false);
    setSaveStatus("saved");
  };

  const handleDeleteItem = async (type, id) => {
    if (!window.confirm(`Delete this ${type}?`)) return;

    if (type === "scene") {
      await deleteScene(projectId, selectedChapter.id, id);
      setScenes((prev) => prev.filter((s) => s.id !== id));
      
      // Unlink any beats that were linked to this scene
      const linkedBeats = beats.filter(b => b.linkedSceneId === id);
      for (const beat of linkedBeats) {
        await unlinkBeat(projectId, selectedChapter.id, beat.id);
      }
      setBeats((prev) => prev.map(b => 
        b.linkedSceneId === id ? { ...b, linkedSceneId: null } : b
      ));
    } else {
      await deleteBeat(projectId, selectedChapter.id, id);
      setBeats((prev) => prev.filter((b) => b.id !== id));
    }

    if (editorId === id) {
      setEditorType(null);
      setEditorId(null);
      setEditingItem(null);
    }
  };

  // Handle linking a beat to a scene
  const handleLinkBeat = async (beatId, sceneId) => {
    // Check if scene is already linked to another beat
    const existingLink = beats.find(b => b.linkedSceneId === sceneId && b.id !== beatId);
    if (existingLink) {
      alert("This scene is already linked to another beat. Each scene can only be linked to one beat.");
      return;
    }

    await linkBeatToScene(projectId, selectedChapter.id, beatId, sceneId);
    
    setBeats((prev) =>
      prev.map((b) => (b.id === beatId ? { ...b, linkedSceneId: sceneId } : b))
    );
    
    setShowLinkSelector(null);
  };

  // Handle unlinking a beat
  const handleUnlinkBeat = async (beatId) => {
    await unlinkBeat(projectId, selectedChapter.id, beatId);
    
    setBeats((prev) =>
      prev.map((b) => (b.id === beatId ? { ...b, linkedSceneId: null } : b))
    );
  };

  // Handle scene reordering with drag and drop
  const handleSceneReorder = async (dragIndex, dropIndex) => {
    const reordered = [...scenes];
    const [removed] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, removed);

    setScenes(reordered);
    
    // Update both scenes and linked beats
    await reorderScenesWithBeats(projectId, selectedChapter.id, reordered, beats);
    
    // Reload to get updated beat order
    const beatsData = await getBeats(projectId, selectedChapter.id);
    setBeats(beatsData);
  };

  const getPairs = () => {
    // Create pairs based on scene order and their linked beats
    return scenes.map((scene) => {
      const linkedBeat = beats.find((b) => b.linkedSceneId === scene.id);
      return {
        scene,
        beat: linkedBeat || null,
      };
    });
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
    if (viewMode === "scenes" || viewMode === "both") {
      setShowSceneModal(true);
    }
    if (viewMode === "beats") {
      setShowBeatModal(true);
    }
  };

  const renderCards = () => {
    if (viewMode === "both") {
      const pairs = getPairs();
      return pairs.map((pair, index) => (
        <div key={`pair-${index}`} className="content-card">
          <SceneSection
            scene={pair.scene}
            isEditing={editingItem?.type === "scene" && editingItem?.id === pair.scene.id}
            onEdit={() => loadIntoEditor("scene", pair.scene)}
            onDelete={() => handleDeleteItem("scene", pair.scene.id)}
            onReorder={(direction) => {
              const newIndex = direction === "up" ? index - 1 : index + 1;
              if (newIndex >= 0 && newIndex < scenes.length) {
                handleSceneReorder(index, newIndex);
              }
            }}
            canMoveUp={index > 0}
            canMoveDown={index < scenes.length - 1}
          />

          {pair.beat ? (
            <BeatSection
              beat={pair.beat}
              isEditing={editingItem?.type === "beat" && editingItem?.id === pair.beat.id}
              onEdit={() => loadIntoEditor("beat", pair.beat)}
              onDelete={() => handleDeleteItem("beat", pair.beat.id)}
              onUnlink={() => handleUnlinkBeat(pair.beat.id)}
              onChangeLink={() => setShowLinkSelector({ beatId: pair.beat.id })}
              linkedScene={pair.scene}
            />
          ) : (
            <div className="card-section empty-section">
              <button className="add-empty-btn">
                <Plus size={18} />
                <span>Add Beat</span>
              </button>
            </div>
          )}
        </div>
      ));
    } else if (viewMode === "scenes") {
      return scenes.map((scene, index) => (
        <div key={scene.id} className="content-card">
          <SceneSection
            scene={scene}
            isEditing={editingItem?.type === "scene" && editingItem?.id === scene.id}
            onEdit={() => loadIntoEditor("scene", scene)}
            onDelete={() => handleDeleteItem("scene", scene.id)}
            onReorder={(direction) => {
              const newIndex = direction === "up" ? index - 1 : index + 1;
              if (newIndex >= 0 && newIndex < scenes.length) {
                handleSceneReorder(index, newIndex);
              }
            }}
            canMoveUp={index > 0}
            canMoveDown={index < scenes.length - 1}
          />
        </div>
      ));
    } else {
      return beats.map((beat) => {
        const linkedScene = beat.linkedSceneId
          ? scenes.find((s) => s.id === beat.linkedSceneId)
          : null;
        return (
          <div key={beat.id} className="content-card">
            <BeatSection
              beat={beat}
              isEditing={editingItem?.type === "beat" && editingItem?.id === beat.id}
              onEdit={() => loadIntoEditor("beat", beat)}
              onDelete={() => handleDeleteItem("beat", beat.id)}
              onUnlink={beat.linkedSceneId ? () => handleUnlinkBeat(beat.id) : null}
              onChangeLink={() => setShowLinkSelector({ beatId: beat.id })}
              linkedScene={linkedScene}
            />
          </div>
        );
      });
    }
  };

  return (
    <div className="chapters-view-container">
      {/* Top Navigation */}
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
                    {chapter.scenes?.length || 0} scenes • {chapter.beats?.length || 0} beats
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
          <span>{getAddButtonText()}</span>
        </button>
      </div>

      {selectedChapter && (
        <div className="chapter-title-bar">
          <input
            className="editor-title-input"
            value={chapterTitleDraft}
            onChange={(e) => setChapterTitleDraft(e.target.value)}
            onBlur={async () => {
              const next = chapterTitleDraft.trim();
              if (!next || next === selectedChapter.title) return;

              await updateChapter(projectId, selectedChapter.id, {
                title: next,
              });

              setChapters((prev) =>
                prev.map((c) =>
                  c.id === selectedChapter.id ? { ...c, title: next } : c
                )
              );

              setSelectedChapter((prev) => ({
                ...prev,
                title: next,
              }));
            }}
            placeholder="Chapter title…"
          />
          <div className="chapter-title-number">
            {scenes.length || 0} scenes • {beats.length || 0} beats • 1023 words
          </div>
        </div>
      )}

      <div className="main-content">
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
                  {editorType === "scene" ? "📄 Scene" : "⚡ Beat"}
                </div>
                <input
                  type="text"
                  className="editor-title-input"
                  value={editorTitle}
                  onChange={(e) => setEditorTitle(e.target.value)}
                  onBlur={saveEditor}
                  placeholder={`${editorType === "scene" ? "Scene" : "Beat"} title...`}
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
                  {saveStatus !== "idle" && (
                    <div className={`save-status ${saveStatus}`}>
                      {saveStatus === "dirty" && "● Not saved"}
                      {saveStatus === "saved" && "● Saved"}
                      {saveStatus === "autosaved" && "● Auto-saved"}
                    </div>
                  )}
                </div>
              </div>

              <div className="editor-content">
                <textarea
                  className="editor-textarea"
                  value={editorContent}
                  onChange={(e) => {
                    setEditorContent(e.target.value);
                    setIsDirty(true);
                    setSaveStatus("dirty");
                  }}
                  placeholder={`Write your ${editorType} here...`}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Link Selector Modal */}
      {showLinkSelector && (
        <LinkSelectorModal
          scenes={scenes}
          currentBeatId={showLinkSelector.beatId}
          onLink={(sceneId) => handleLinkBeat(showLinkSelector.beatId, sceneId)}
          onClose={() => setShowLinkSelector(null)}
        />
      )}
    </div>
  );
}

// Scene Section Component
function SceneSection({ scene, isEditing, onEdit, onDelete, onReorder, canMoveUp, canMoveDown }) {
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
            <div className="card-meta">
              {scene.location} • {scene.time || "Unspecified time"}
            </div>
          )}
        </div>
        <div className="card-actions">
          {onReorder && (
            <>
              <button
                className="card-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onReorder("up");
                }}
                disabled={!canMoveUp}
                title="Move up"
              >
                ↑
              </button>
              <button
                className="card-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onReorder("down");
                }}
                disabled={!canMoveDown}
                title="Move down"
              >
                ↓
              </button>
            </>
          )}
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
      </div>
      <div className="card-content">{scene.text || "No content yet..."}</div>
    </div>
  );
}

// Beat Section Component
function BeatSection({ beat, isEditing, onEdit, onDelete, onUnlink, onChangeLink, linkedScene }) {
  return (
    <div
      className={`card-section beat ${isEditing ? "editing" : ""}`}
      onClick={onEdit}
    >
      <div className="card-type-label beat">⚡ Beat</div>
      <div className="card-header">
        <div className="card-title">
          <div className="card-title-text">{beat.title || "Untitled Beat"}</div>
          {linkedScene && (
            <div className="card-meta">
              <LinkIcon size={12} />{linkedScene.title || "Untitled Scene"}
            </div>
          )}
        </div>
        <div className="card-actions">
          {linkedScene ? (
            <button
              className="card-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onUnlink();
              }}
              title="Unlink from scene"
            >
              <Unlink size={14} />
            </button>
          ) : (
            <button
              className="card-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onChangeLink();
              }}
              title="Link to scene"
            >
              <LinkIcon size={14} />
            </button>
          )}
          <button
            className="card-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onChangeLink();
            }}
            title="Change linked scene"
          >
            🔄
          </button>
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
      </div>
      <div className="card-content">{beat.description || "No content yet..."}</div>
    </div>
  );
}

// Link Selector Modal Component
function LinkSelectorModal({ scenes, currentBeatId, onLink, onClose }) {
  return (
    <div className="link-selector-overlay" onClick={onClose}>
      <div className="link-selector-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="link-selector-title">Link Beat to Scene</h3>
        <div className="link-selector-list">
          {scenes.map((scene) => (
            <button
              key={scene.id}
              className="link-selector-item"
              onClick={() => onLink(scene.id)}
            >
              <div className="link-selector-item-title">
                {scene.title || "Untitled Scene"}
              </div>
              <div className="link-selector-item-meta">
                {scene.location || "No location"}
              </div>
            </button>
          ))}
        </div>
        <button className="link-selector-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}