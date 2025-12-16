import React, { useState, useCallback, useRef, useEffect } from "react";
import "./ChaptersView.css";
import { useParams } from "react-router-dom";
import { useFirestore } from "../../../context/FirestoreContext";
import { getVersionOptions, getVersionLabel } from "../../../utils/versionUtils";
import LinkSelectorModal from "./components/LinkSelectorModal";
import EditorPanel from "./components/EditorPanel";
import CardsPanel from "./components/CardsPanel";
import TopNav from "./components/TopNav";
import OutlineDrawer from "./components/OutlineDrawer";
import FloatingAddMenu from "./components/FloatingAddMenu";
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
  const [cardsWidth, setCardsWidth] = useState(30); 
  const [isResizing, setIsResizing] = useState(false);
  const mainContentRef = useRef(null);
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [outlineExpanded, setOutlineExpanded] = useState({});
  const [outlineScenes, setOutlineScenes] = useState({});
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");

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

  const openEditor = useCallback(
    (type, item, versionId = null) => {
      loadIntoEditor(type, item, versionId, setEditingItem);
    },
    [loadIntoEditor]
  );

  const chapterNumber = selectedChapter
    ? chapters
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .findIndex((c) => c.id === selectedChapter.id) + 1
    : null;

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

  const handleAddBeatToScene = async (sceneId) => {
    if (!selectedChapter) return;

    try {
      const orderIndex = beats.length;
      const newBeatData = {
        title: `Beat ${orderIndex + 1}`,
        description: "",
        orderIndex,
        linkedSceneId: sceneId,
      };
      const docRef = await createBeat(projectId, selectedChapter.id, newBeatData);
      const newBeat = { id: docRef.id, ...newBeatData };
      setBeats((prev) => [...prev, newBeat]);
      openEditor("beat", newBeat);
      return newBeat;
    } catch (error) {
      console.error("Error al crear beat:", error);
      alert("Error al crear el beat. IntAcntalo de nuevo.");
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

  // Listen for floating add-chapter button event
  useEffect(() => {
    const addChapterHandler = () => {
      handleAddChapter();
    };
    const addSceneHandler = () => {
      // Use existing flow: set view to scenes and add
      setViewMode("scenes");
      handleAddScene();
    };
    const addBeatHandler = () => {
      setViewMode("beats");
      handleAddBeat();
    };
    window.addEventListener("add-chapter", addChapterHandler);
    window.addEventListener("add-scene", addSceneHandler);
    window.addEventListener("add-beat", addBeatHandler);
    return () => {
      window.removeEventListener("add-chapter", addChapterHandler);
      window.removeEventListener("add-scene", addSceneHandler);
      window.removeEventListener("add-beat", addBeatHandler);
    };
  }, [handleAddChapter]);

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
        projectId={projectId}
        viewMode={viewMode}
        setViewMode={setViewMode}
        handleAdd={handleAdd}
        addButtonText={getAddButtonText()}
        outlineOpen={outlineOpen}
        setOutlineOpen={setOutlineOpen}
      />
      
      <div className="main-content" ref={mainContentRef}>
        <CardsPanel
          style={{ width: `${cardsWidth}%` }}
          scenes={scenes}
          beats={beats}
          viewMode={viewMode}
          editingItem={editingItem}
          openEditor={openEditor}
          handleSceneReorder={handleSceneReorder}
          handleUnlinkBeat={handleUnlinkBeat}
          handleSelectVersion={handleSelectVersion}
          handleDeleteItem={handleDeleteItem}
          handleAddBeatToScene={handleAddBeatToScene}
          setShowLinkSelector={setShowLinkSelector}
          selectedChapter={selectedChapter}
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

      <FloatingAddMenu
        onAddScene={() => {
          setViewMode("scenes");
          handleAddScene();
        }}
        onAddBeat={() => {
          setViewMode("beats");
          handleAddBeat();
        }}
        onAddChapter={() => window.dispatchEvent(new CustomEvent("add-chapter"))}
      />

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
    </div>
  );
}
