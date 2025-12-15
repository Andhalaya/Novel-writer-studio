import React, { useState, useEffect } from "react";
import "./ChaptersView.css";
import { useParams } from "react-router-dom";
import { useFirestore } from "../../../context/FirestoreContext";
import {
  ChevronDown,
  Plus,
} from "lucide-react";
import {
  getVersionOptions,
  getVersionLabel,
  getDisplayContent,
} from "../../../utils/versionUtils";
import SceneSection from "./components/SceneSection";
import BeatSection from "./components/BeatSection";
import LinkSelectorModal from "./components/LinkSelectorModal";
import EditorPanel from "./components/EditorPanel";
import CardsPanel from "./components/CardsPanel";
import TopNav from "./components/TopNav";
import { useChapterData } from "../../../hooks/useChapterData";
import { useChapterEditor } from "../../../hooks/useChapterEditor";

export default function ChaptersView() {
  const { projectId } = useParams();
  const {
    getChapters,
    getBeats,
    getScenes,
    createScene,
    createBeat,
    updateBeat,
    updateScene,
    updateChapter,
    deleteScene,
    deleteBeat,
    linkBeatToScene,
    unlinkBeat,
    reorderScenesWithBeats,
  } = useFirestore();

  const {
    chapters,
    setChapters,
    selectedChapter,
    setSelectedChapter,
    scenes,
    setScenes,
    beats,
    setBeats,
    loadChapter,
    handleLinkBeat,
    handleUnlinkBeat,
    handleSceneReorder,
  } = useChapterData(projectId, {
    getChapters,
    getScenes,
    getBeats,
    linkBeatToScene,
    unlinkBeat,
    reorderScenesWithBeats,
  });
  const [viewMode, setViewMode] = useState("both");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [chapterTitleDraft, setChapterTitleDraft] = useState("");
  const [showLinkSelector, setShowLinkSelector] = useState(null); // { beatId: string }

  const {
    editorTitle,
    setEditorTitle,
    editorContent,
    setEditorContent,
    editorType,
    editorId,
    editorVersionId,
    setIsDirty,
    saveStatus,
    setSaveStatus,
    loadIntoEditor,
    saveCurrentVersion,
    saveNewVersion,
    addVersionToManuscript,
    deleteCurrentVersion,
    saveEditor,
    handleSelectVersion,
  } = useChapterEditor({
    projectId,
    selectedChapter,
    scenes,
    setScenes,
    beats,
    setBeats,
    updateScene,
    updateBeat,
  });

  useEffect(() => {
    if (selectedChapter) {
      setChapterTitleDraft(selectedChapter.title);
    }
  }, [selectedChapter]);

  const chapterNumber = selectedChapter
    ? chapters
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .findIndex((c) => c.id === selectedChapter.id) + 1
    : null;

  const handleSelectChapter = async (chapter) => {
    await loadChapter(chapter);
    setChapterTitleDraft(chapter.title);
    setEditingItem(null);
  };

  const openEditor = (type, item, versionId = null) => {
    loadIntoEditor(type, item, versionId, setEditingItem);
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
    if (viewMode === "scenes") {
      handleAddScene();
    } else if (viewMode === "beats") {
      handleAddBeat();
    } else {
      handleAddSceneAndBeatPair();
    }
  };

  const handleAddScene = async () => {
    if (!selectedChapter) return;
    const orderIndex = scenes.length;
    const newSceneData = {
      title: `Scene ${orderIndex + 1}`,
      text: "",
      orderIndex,
    };
    const docRef = await createScene(projectId, selectedChapter.id, newSceneData);
    const newScene = { id: docRef.id, ...newSceneData };
    setScenes((prev) => [...prev, newScene]);
    openEditor("scene", newScene);
  };

  const handleAddBeat = async () => {
    if (!selectedChapter) return;
    const orderIndex = beats.length;
    const newBeatData = {
      title: `Beat ${orderIndex + 1}`,
      description: "",
      orderIndex,
      linkedSceneId: null,
    };
    const docRef = await createBeat(projectId, selectedChapter.id, newBeatData);
    const newBeat = { id: docRef.id, ...newBeatData };
    setBeats((prev) => [...prev, newBeat]);
    openEditor("beat", newBeat);
  };

  const handleAddSceneAndBeatPair = async () => {
    await handleAddScene();
    await handleAddBeat();
  };

  const renderCards = () => {
    if (viewMode === "both") {
      const pairs = getPairs();
      return pairs.map((pair, index) => (
        <div key={`pair-${index}`} className="content-card">
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
  const currentScene = editorType === "scene" ? scenes.find((s) => s.id === editorId) : null;
  const editorVersionOptions = currentScene ? getVersionOptions(currentScene) : [];
  const activeVersionLabel =
    currentScene && currentScene.activeVersionId
      ? getVersionLabel(currentScene, currentScene.activeVersionId)
      : "Version 1";

  return (
    <div className="chapters-view-container">
            <TopNav
        selectedChapter={selectedChapter}
        chapterNumber={chapterNumber}
        dropdownOpen={dropdownOpen}
        setDropdownOpen={setDropdownOpen}
        chapters={chapters}
        onSelectChapter={handleSelectChapter}
        viewMode={viewMode}
        setViewMode={setViewMode}
        handleAdd={handleAdd}
        addButtonText={getAddButtonText()}
      />      
  <div className="main-content">
        <CardsPanel
          selectedChapter={selectedChapter}
          scenes={scenes}
          beats={beats}
          renderCards={renderCards}
        /><div className="editor-panel">
          <EditorPanel
            editorType={editorType}
            editorTitle={editorTitle}
            setEditorTitle={setEditorTitle}
            editorContent={editorContent}
            setEditorContent={setEditorContent}
            editorVersionId={editorVersionId}
            editorVersionOptions={editorVersionOptions}
            activeVersionLabel={activeVersionLabel}
            handleSelectVersion={handleSelectVersion}
            saveCurrentVersion={saveCurrentVersion}
            saveNewVersion={saveNewVersion}
            addVersionToManuscript={addVersionToManuscript}
            deleteCurrentVersion={deleteCurrentVersion}
            saveEditor={saveEditor}
            handleDeleteItem={handleDeleteItem}
            setIsDirty={setIsDirty}
            setSaveStatus={setSaveStatus}
            saveStatus={saveStatus}
            editorId={editorId}
          />
        </div>
      {/* Link Selector Modal */}
      {showLinkSelector && (
        <LinkSelectorModal
          scenes={scenes}
          currentBeatId={showLinkSelector.beatId}
          onLink={async (sceneId) => {
            await handleLinkBeat(showLinkSelector.beatId, sceneId);
            setShowLinkSelector(null);
          }}
          onClose={() => setShowLinkSelector(null)}
        />
      )}
      </div>
    </div>
  );
}

