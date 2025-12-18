import React, { useState, useCallback, useEffect } from "react";
import "./ChaptersView.css";
import { useParams } from "react-router-dom";
import { useFirestore } from "../../../context/FirestoreContext";
import LinkSelectorModal from "./components/LinkSelectorModal";
import EditorPanel from "./components/EditorPanel/EditorPanel";
import CardsPanel from "./components/CardsPanel";
import TopNav from "./components/TopNav";
import OutlineDrawer from "./components/OutlineDrawer/OutlineDrawer";
import FloatingAddMenu from "./components/FloatingAddMenu";
import { useChapterData } from "../../../hooks/useChapterData";
import { useChapterEditor } from "../../../hooks/useChapterEditor";
import { useChapterCRUD } from "../../../hooks/useChapterCRUD";
import { useResizablePanels } from "../../../hooks/useResizablePanels";

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
  const {
    width: cardsWidth,
    isResizing,
    startResizing,
    containerRef: mainContentRef,
  } = useResizablePanels({ min: 20, max: 60, initial: 30 });
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

  const {
    handleAddScene,
    handleAddBeat,
    handleAddBeatToScene,
    handleAddSceneAndBeatPair,
    handleDeleteItem,
    handleDeleteChapter,
  } = useChapterCRUD({
    projectId,
    selectedChapter,
    chapters,
    setChapters,
    scenes,
    setScenes,
    beats,
    setBeats,
    loadChapter,
    createScene,
    createBeat,
    deleteScene,
    deleteBeat,
    deleteChapter,
    unlinkBeat,
    getBeats,
    openEditor,
    setEditingItem,
  });

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

  const handleUpdateChapter = async (chapterId, data) => {
  await updateChapter(projectId, chapterId, data);
  // Refresh chapters list
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

  

  return (
    <div className="chapters-view-container">
      <TopNav
        outlineOpen={outlineOpen}
        setOutlineOpen={setOutlineOpen}
      />

      <div className="main-content" ref={mainContentRef}>
        <CardsPanel
          style={{ width: `${cardsWidth}%` }}
          scenes={scenes}
          beats={beats}
          viewMode={viewMode}
          setViewMode={setViewMode}
          chapters={chapters}
          selectedChapter={selectedChapter}
          chapterNumber={chapterNumber}
          loadChapter={loadChapter}
          editingItem={editingItem}
          openEditor={openEditor}
          handleSceneReorder={handleSceneReorder}
          handleUnlinkBeat={handleUnlinkBeat}
          handleSelectVersion={handleSelectVersion}
          handleDeleteItem={handleDeleteItem}
          handleAddBeatToScene={handleAddBeatToScene}
          setShowLinkSelector={setShowLinkSelector}
        />

        <div
          className={`panel-resizer ${isResizing ? "active" : ""}`}
          onMouseDown={startResizing}
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
            scenes={scenes}
          />
        </div>

        <OutlineDrawer
          open={outlineOpen}
          chapters={chapters}
          scenesByChapter={outlineScenes}
          expandedMap={outlineExpanded}
          onToggleChapter={toggleOutlineChapter}
          onDeleteChapter={handleDeleteChapter}
          onCreateChapter={handleCreateChapter}  
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
        onAddChapter={handleAddChapter}
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
