import React, { useMemo, useState } from "react";
import SceneSection from "../SceneSection/SceneSection";
import BeatSection from "../BeatSection/BeatSection";
import { getVersionLabel, getVersionOptions, getDisplayContent } from "../../../../../utils/versionUtils";
// import './CardsPanel.css'
import './Panel1.css'

export default function CardsPanel({
  style,
  scenes = [],
  beats = [],
  viewMode = "both",
  setViewMode,
  chapters = [],
  selectedChapter,
  chapterNumber,
  loadChapter,
  editingItem,
  openEditor,
  handleSceneReorder,
  handleUnlinkBeat,
  handleSelectVersion,
  handleDeleteItem,
  handleAddBeatToScene,
  setShowLinkSelector,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const pairs = useMemo(() => {
    return scenes.map((scene) => {
      const linkedBeat = beats.find((b) => b.linkedSceneId === scene.id);
      return { scene, beat: linkedBeat || null };
    });
  }, [scenes, beats]);

  const renderCards = () => {
    if (viewMode === "both") {
      return pairs.map((pair, index) => (
        <div key={`pair-${pair.scene.id}`} className="content-card">
          <SceneSection
            scene={pair.scene}
            isEditing={editingItem?.type === "scene" && editingItem?.id === pair.scene.id}
            onEdit={() => openEditor("scene", pair.scene)}
            onDelete={() => handleDeleteItem("scene", pair.scene.id)}
            onReorder={(direction) => {
              const newIndex = direction === "up" ? index - 1 : index + 1;
              if (newIndex >= 0 && newIndex < scenes.length) {
                handleSceneReorder(index, newIndex);
              }
            }}
            canMoveUp={index > 0}
            canMoveDown={index < scenes.length - 1}
            activeVersionLabel={getVersionLabel(pair.scene, pair.scene.activeVersionId)}
            versionOptions={getVersionOptions(pair.scene)}
            activeVersionId={pair.scene.activeVersionId}
            onSelectVersion={(versionId) => handleSelectVersion(pair.scene.id, versionId)}
            displayContent={getDisplayContent(pair.scene)}
            beat={pair.beat}
            onChangeLink={() => pair.beat && setShowLinkSelector({ beatId: pair.beat.id })}
            onUnlinkBeat={() => pair.beat && handleUnlinkBeat(pair.beat.id)}
            onDeleteBeat={() => pair.beat && handleDeleteItem("beat", pair.beat.id)}
            onAddBeat={() => handleAddBeatToScene(pair.scene.id)}
          />
        </div>
      ));
    } else if (viewMode === "scenes") {
      return scenes.map((scene, index) => (
        <div key={scene.id} className="content-card">
          <SceneSection
            scene={scene}
            isEditing={editingItem?.type === "scene" && editingItem?.id === scene.id}
            onEdit={() => openEditor("scene", scene)}
            onDelete={() => handleDeleteItem("scene", scene.id)}
            onReorder={(direction) => {
              const newIndex = direction === "up" ? index - 1 : index + 1;
              if (newIndex >= 0 && newIndex < scenes.length) {
                handleSceneReorder(index, newIndex);
              }
            }}
            canMoveUp={index > 0}
            canMoveDown={index < scenes.length - 1}
            activeVersionLabel={getVersionLabel(scene, scene.activeVersionId)}
            versionOptions={getVersionOptions(scene)}
            activeVersionId={scene.activeVersionId}
            onSelectVersion={(versionId) => handleSelectVersion(scene.id, versionId)}
            displayContent={getDisplayContent(scene)}
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
              onEdit={() => openEditor("beat", beat)}
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
    <div className="cards-panel" style={style}>
      <div className="cards-panel-header">
        <div className="view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === "both" ? "active" : ""}`}
            onClick={() => setViewMode && setViewMode("both")}
          >
            Both
          </button>
          <button
            className={`view-toggle-btn ${viewMode === "scenes" ? "active" : ""}`}
            onClick={() => setViewMode && setViewMode("scenes")}
          >
            Scenes
          </button>
          <button
            className={`view-toggle-btn ${viewMode === "beats" ? "active" : ""}`}
            onClick={() => setViewMode && setViewMode("beats")}
          >
            Beats
          </button>
        </div>

        <div className="chapter-selector inline">
          <button
            className="chapter-dropdown-btn"
            onClick={() => setDropdownOpen((o) => !o)}
          >
            <span>{selectedChapter ? `Chapter ${chapterNumber}` : "Select a chapter"}</span>
          </button>
          <div className={`chapter-dropdown ${dropdownOpen ? "open" : ""}`}>
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                className={`chapter-dropdown-item ${selectedChapter?.id === chapter.id ? "active" : ""}`}
                onClick={() => {
                  if (loadChapter) loadChapter(chapter);
                  setDropdownOpen(false);
                }}
              >
                <div className="chapter-dropdown-title">{chapter.title}</div>
                <div className="chapter-dropdown-meta">
                  {(chapter.scenes?.length || 0)} scenes • {(chapter.beats?.length || 0)} beats
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!selectedChapter ? (
        <div className="empty-state">
          <div className="empty-icon">[doc]</div>
          <p className="empty-text">Select a chapter to begin</p>
        </div>
      ) : scenes.length === 0 && beats.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">[doc]</div>
          <p className="empty-text">No scenes or beats yet</p>
          <p className="empty-hint">Add a scene or a beat to start</p>
        </div>
      ) : (
        renderCards()
      )}
    </div>
  );
}
