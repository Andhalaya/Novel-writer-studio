import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import "./ChaptersView.css";
import { useParams } from "react-router-dom";
import { useFirestore } from "../../../context/FirestoreContext";
import { Plus } from "lucide-react";
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
import OutlineDrawer from "./components/OutlineDrawer";
import { useChapterData } from "../../../hooks/useChapterData";
import { useChapterEditor } from "../../../hooks/useChapterEditor";

export default function ChaptersView() {
  const { projectId } = useParams();
  const {
    getChapters,
    getBeats,
    getScenes,
    createChapter,
    createScene,
    createBeat,
    updateBeat,
    updateScene,
    deleteScene,
    deleteBeat,
    deleteChapter,
    linkBeatToScene,
    unlinkBeat,
    reorderScenesWithBeats,
  } = useFirestore();

  const {
    chapters,
    setChapters,
    selectedChapter,
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
  const [editingItem, setEditingItem] = useState(null);
  const [showLinkSelector, setShowLinkSelector] = useState(null);
  const [cardsWidth, setCardsWidth] = useState(30); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const mainContentRef = useRef(null);
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [outlineExpanded, setOutlineExpanded] = useState({});
  const [outlineScenes, setOutlineScenes] = useState({});

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

  const chapterNumber = selectedChapter
    ? chapters
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .findIndex((c) => c.id === selectedChapter.id) + 1
    : null;

  const openEditor = useCallback((type, item, versionId = null) => {
    loadIntoEditor(type, item, versionId, setEditingItem);
  }, [loadIntoEditor]);

  const handleDeleteItem = async (type, id) => {
    if (!window.confirm(`¿Eliminar este ${type === "scene" ? "escena" : "beat"}?`)) return;

    try {
      if (type === "scene") {
        // Primero desenlazar todos los beats vinculados
        const linkedBeats = beats.filter(b => b.linkedSceneId === id);
        
        for (const beat of linkedBeats) {
          await unlinkBeat(projectId, selectedChapter.id, beat.id);
        }

        // Eliminar la escena
        await deleteScene(projectId, selectedChapter.id, id);
        setScenes((prev) => prev.filter((s) => s.id !== id));

        // Recargar beats desde Firestore para asegurar sincronización
        const updatedBeats = await getBeats(projectId, selectedChapter.id);
        setBeats(updatedBeats);
      } else {
        await deleteBeat(projectId, selectedChapter.id, id);
        setBeats((prev) => prev.filter((b) => b.id !== id));
      }

      if (editorId === id) {
        setEditingItem(null);
      }
    } catch (error) {
      console.error(`Error al eliminar ${type}:`, error);
      alert(`Error al eliminar. Por favor, inténtalo de nuevo.`);
    }
  };

  // Memorizar los pares para evitar recalcular en cada render
  const pairs = useMemo(() => {
    return scenes.map((scene) => {
      const linkedBeat = beats.find((b) => b.linkedSceneId === scene.id);
      return {
        scene,
        beat: linkedBeat || null,
      };
    });
  }, [scenes, beats]);

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
    
    try {
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
      return newScene;
    } catch (error) {
      console.error("Error al crear escena:", error);
      alert("Error al crear la escena. Inténtalo de nuevo.");
      return null;
    }
  };

  const handleAddBeat = async () => {
    if (!selectedChapter) return;
    
    try {
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
      return newBeat;
    } catch (error) {
      console.error("Error al crear beat:", error);
      alert("Error al crear el beat. Inténtalo de nuevo.");
      return null;
    }
  };

  // Optimizado para crear en paralelo
  const handleAddSceneAndBeatPair = async () => {
    if (!selectedChapter) return;

    try {
      const orderIndexScene = scenes.length;
      const orderIndexBeat = beats.length;

      const [sceneRef, beatRef] = await Promise.all([
        createScene(projectId, selectedChapter.id, {
          title: `Scene ${orderIndexScene + 1}`,
          text: "",
          orderIndex: orderIndexScene,
        }),
        createBeat(projectId, selectedChapter.id, {
          title: `Beat ${orderIndexBeat + 1}`,
          description: "",
          orderIndex: orderIndexBeat,
          linkedSceneId: null,
        })
      ]);

      const newScene = {
        id: sceneRef.id,
        title: `Scene ${orderIndexScene + 1}`,
        text: "",
        orderIndex: orderIndexScene,
      };

      const newBeat = {
        id: beatRef.id,
        title: `Beat ${orderIndexBeat + 1}`,
        description: "",
        orderIndex: orderIndexBeat,
        linkedSceneId: null,
      };

      setScenes((prev) => [...prev, newScene]);
      setBeats((prev) => [...prev, newBeat]);
      
      // Abrir el editor con la nueva escena
      openEditor("scene", newScene);
    } catch (error) {
      console.error("Error al crear par escena-beat:", error);
      alert("Error al crear el par. Inténtalo de nuevo.");
    }
  };

  // Función auxiliar para crear y vincular beat a una escena específica
  const handleAddBeatToScene = async (sceneId) => {
    if (!selectedChapter) return;

    try {
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

      // Vincular automáticamente a la escena
      await handleLinkBeat(newBeat.id, sceneId);

      openEditor("beat", newBeat);
    } catch (error) {
      console.error("Error al crear y vincular beat:", error);
      alert("Error al crear el beat. Inténtalo de nuevo.");
    }
  };

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

  const toggleOutlineChapter = async (chapter) => {
    setOutlineExpanded((prev) => ({
      ...prev,
      [chapter.id]: !prev[chapter.id],
    }));

    if (!outlineScenes[chapter.id]) {
      try {
        const sc = await getScenes(projectId, chapter.id);
        setOutlineScenes((prev) => ({ ...prev, [chapter.id]: sc }));
      } catch (e) {
        console.error("Error loading scenes for outline:", e);
      }
    }
  };

  const handleDeleteChapter = async (chapter) => {
    if (!chapter) return;
    if (!window.confirm(`Delete "${chapter.title}"?`)) return;
    try {
      await deleteChapter(projectId, chapter.id);
      const remaining = chapters.filter((c) => c.id !== chapter.id);
      setChapters(remaining);
      if (selectedChapter?.id === chapter.id) {
        if (remaining.length) {
          await loadChapter(remaining[0]);
        } else {
          setScenes([]);
          setBeats([]);
        }
      }
    } catch (err) {
      console.error("Error deleting chapter:", err);
      alert("Could not delete chapter. Please try again.");
    }
  };

  const currentScene = editorType === "scene" ? scenes.find((s) => s.id === editorId) : null;
  const editorVersionOptions = currentScene ? getVersionOptions(currentScene) : [];
  const activeVersionLabel =
    currentScene && currentScene.activeVersionId
      ? getVersionLabel(currentScene, currentScene.activeVersionId)
      : "Version 1";

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e) => {
      const container = mainContentRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const percent = Math.min(60, Math.max(20, (relativeX / rect.width) * 100));
      setCardsWidth(percent);
    };
    const handleMouseUp = () => setIsResizing(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="chapters-view-container">
      <TopNav
        selectedChapter={selectedChapter}
        chapterNumber={chapterNumber}
        chapters={chapters}
        setChapters={setChapters}
        loadChapter={loadChapter}
        setScenes={setScenes}
        setBeats={setBeats}
        deleteChapter={deleteChapter}
        createChapter={createChapter}
        projectId={projectId}
        viewMode={viewMode}
        setViewMode={setViewMode}
        handleAdd={handleAdd}
        addButtonText={getAddButtonText()}
        outlineOpen={outlineOpen}
        setOutlineOpen={setOutlineOpen}
        setEditingItem={setEditingItem}
      />
      
      <div className="main-content" ref={mainContentRef}>
        <CardsPanel
          selectedChapter={selectedChapter}
          scenes={scenes}
          beats={beats}
          renderCards={renderCards}
          style={{ width: `${cardsWidth}%` }}
        />

        <div
          className={`panel-resizer ${isResizing ? "active" : ""}`}
          onMouseDown={() => setIsResizing(true)}
          title="Drag to resize"
        />

        <div className="editor-panel" style={{ flex: outlineOpen ? "1 1 auto" : "1 1 100%" }}>
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

        <OutlineDrawer
          open={outlineOpen}
          setOpen={setOutlineOpen}
          chapters={chapters}
          scenesByChapter={outlineScenes}
          expandedMap={outlineExpanded}
          onToggleChapter={toggleOutlineChapter}
          onDeleteChapter={handleDeleteChapter}
        />

        {/* Link Selector Modal */}
        {showLinkSelector && (
          <LinkSelectorModal
            scenes={scenes}
            currentBeatId={showLinkSelector.beatId}
            onLink={async (sceneId) => {
              try {
                await handleLinkBeat(showLinkSelector.beatId, sceneId);
                setShowLinkSelector(null);
              } catch (error) {
                console.error("Error al vincular beat:", error);
                alert("Error al vincular. Inténtalo de nuevo.");
              }
            }}
            onClose={() => setShowLinkSelector(null)}
          />
        )}
      </div>

    </div>
  );
}
