import React, { useMemo } from "react";
import { Plus } from "lucide-react";
import SceneSection from "./SceneSection";
import BeatSection from "./BeatSection";
import { getVersionLabel, getVersionOptions, getDisplayContent } from "../../../../utils/versionUtils";

export default function CardsPanel({
  style,
  scenes = [],
  beats = [],
  viewMode = "both",
  editingItem,
  openEditor,
  handleSceneReorder,
  handleUnlinkBeat,
  handleSelectVersion,
  handleDeleteItem,
  handleAddBeatToScene,
  setShowLinkSelector,
  selectedChapter,
}) {
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
          />

          {pair.beat ? (
            <BeatSection
              beat={pair.beat}
              isEditing={editingItem?.type === "beat" && editingItem?.id === pair.beat.id}
              onEdit={() => openEditor("beat", pair.beat)}
              onDelete={() => handleDeleteItem("beat", pair.beat.id)}
              onUnlink={() => handleUnlinkBeat(pair.beat.id)}
              onChangeLink={() => setShowLinkSelector({ beatId: pair.beat.id })}
              linkedScene={pair.scene}
            />
          ) : (
            <div className="card-section empty-section">
              <button
                className="add-empty-btn"
                onClick={() => handleAddBeatToScene(pair.scene.id)}
              >
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
      {!selectedChapter ? (
        <div className="empty-state">
          <div className="empty-icon">✨</div>
          <p className="empty-text">Select a chapter to begin</p>
        </div>
      ) : scenes.length === 0 && beats.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✨</div>
          <p className="empty-text">No scenes or beats yet</p>
          <p className="empty-hint">Add a scene or a beat to start</p>
        </div>
      ) : (
        renderCards()
      )}
    </div>
  );
}
