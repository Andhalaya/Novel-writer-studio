import React, { useState, useEffect } from "react";
import "./ChaptersView.css";
import { useParams } from "react-router-dom";
import { useFirestore } from "../../../context/FirestoreContext";
import {
  ChevronDown,
  Plus,
} from "lucide-react";
import {
  BASE_VERSION_ID,
  getVersionOptions,
  getVersionLabel,
  getDisplayContent,
} from "../../../utils/versionUtils";
import SceneSection from "./components/SceneSection";
import BeatSection from "./components/BeatSection";
import LinkSelectorModal from "./components/LinkSelectorModal";
import EditorPanel from "./components/EditorPanel";
import { useChapterData } from "../../../hooks/useChapterData";

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
    loadChapters,
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
  const [editorVersionId, setEditorVersionId] = useState(BASE_VERSION_ID);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");

  useEffect(() => {
    if (!editorType || !editorId || !selectedChapter) return;

    const interval = setInterval(async () => {
      if (!isDirty) return;
      if (editorType === "scene") return;

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

      setIsDirty(false);
      setSaveStatus("saved");
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
    setEditorType(null);
  };

  const loadIntoEditor = (type, item, versionId = null) => {
    setEditorType(type);
    setEditorId(item.id);
    if (type === "scene") {
      const options = getVersionOptions(item);
      const activeId = versionId || item.activeVersionId || BASE_VERSION_ID;
      const activeVersion =
        options.find((v) => v.id === activeId) || options[0] || {};
      setEditorVersionId(activeVersion.id || BASE_VERSION_ID);
      setEditorTitle(
        activeVersion.title ||
        item.title ||
        (type === "scene" ? "Untitled Scene" : "Untitled Beat")
      );
      setEditorContent(activeVersion.text || item.text || "");
    } else {
      setEditorTitle(item.title || "Untitled Beat");
      setEditorContent(item.description || "");
    }
    setEditingItem({ type, id: item.id });
    setIsDirty(false);
    setSaveStatus("idle");
  };

  const saveEditor = async () => {
    if (!editorType || !editorId) return;

    if (editorType === "scene") {
      await saveCurrentVersion();
      return;
    }

    await updateBeat(projectId, selectedChapter.id, editorId, {
      description: editorContent,
      title: editorTitle,
    });
    setBeats((prev) =>
      prev.map((b) =>
        b.id === editorId ? { ...b, description: editorContent, title: editorTitle } : b
      )
    );

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

  const handleSelectVersion = (sceneId, versionId) => {
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) return;
    loadIntoEditor("scene", scene, versionId);
  };

  const saveCurrentVersion = async () => {
    if (editorType !== "scene" || !editorId) return;
    const scene = scenes.find((s) => s.id === editorId);
    if (!scene) return;

    if (editorVersionId === BASE_VERSION_ID) {
      await updateScene(projectId, selectedChapter.id, editorId, {
        text: editorContent,
        title: editorTitle,
        activeVersionId: BASE_VERSION_ID,
      });
      setScenes((prev) =>
        prev.map((s) =>
          s.id === editorId
            ? { ...s, text: editorContent, title: editorTitle, activeVersionId: BASE_VERSION_ID }
            : s
        )
      );
    } else {
      const updatedVersions = (scene.versions || []).map((v) =>
        v.id === editorVersionId
          ? { ...v, title: editorTitle, label: editorTitle, text: editorContent }
          : v
      );
      await updateScene(projectId, selectedChapter.id, editorId, {
        versions: updatedVersions,
      });
      setScenes((prev) =>
        prev.map((s) => (s.id === editorId ? { ...s, versions: updatedVersions } : s))
      );
    }

    setIsDirty(false);
    setSaveStatus("saved");
  };

  const saveNewVersion = async () => {
    if (editorType !== "scene" || !editorId) return;
    const scene = scenes.find((s) => s.id === editorId);
    if (!scene) return;

    const nextVersionNumber = (scene.versions?.length || 0) + 2; // base version is 1
    const versionLabel = `Version ${nextVersionNumber}`;

    const nextVersions = [
      {
        id: `ver-${Date.now()}`,
        title: versionLabel,
        label: versionLabel,
        text: editorContent || "",
        createdAt: new Date().toISOString(),
      },
      ...(scene.versions || []),
    ];

    await updateScene(projectId, selectedChapter.id, editorId, { versions: nextVersions });
    setScenes((prev) =>
      prev.map((s) => (s.id === editorId ? { ...s, versions: nextVersions } : s))
    );
    setEditorVersionId(nextVersions[0].id);
    setIsDirty(false);
    setSaveStatus("saved");
  };

  const addVersionToManuscript = async () => {
    if (editorType !== "scene" || !editorId) return;
    const scene = scenes.find((s) => s.id === editorId);
    if (!scene) return;

    if (editorVersionId === BASE_VERSION_ID) {
      // Publish the base scene (also update base content)
      await updateScene(projectId, selectedChapter.id, editorId, {
        text: editorContent,
        title: editorTitle,
        manuscriptText: editorContent,
        manuscriptTitle: editorTitle,
        activeVersionId: BASE_VERSION_ID,
      });

      setScenes((prev) =>
        prev.map((s) =>
          s.id === editorId
            ? {
                ...s,
                text: editorContent,
                title: editorTitle,
                manuscriptText: editorContent,
                manuscriptTitle: editorTitle,
                activeVersionId: BASE_VERSION_ID,
              }
            : s
        )
      );
    } else {
      // Publish a specific version (keep base title/text intact)
      const updatedVersions = (scene.versions || []).map((v) =>
        v.id === editorVersionId
          ? { ...v, title: editorTitle, label: editorTitle, text: editorContent }
          : v
      );
      const selectedVersion = updatedVersions.find((v) => v.id === editorVersionId);
      const manuscriptTitle = selectedVersion?.title || selectedVersion?.label || scene.title;
      const manuscriptText = selectedVersion?.text || scene.text;

      await updateScene(projectId, selectedChapter.id, editorId, {
        manuscriptText,
        manuscriptTitle,
        activeVersionId: editorVersionId,
        versions: updatedVersions,
      });

      setScenes((prev) =>
        prev.map((s) =>
          s.id === editorId
            ? {
                ...s,
                manuscriptText,
                manuscriptTitle,
                activeVersionId: editorVersionId,
                versions: updatedVersions,
              }
            : s
        )
      );
    }

    setIsDirty(false);
    setSaveStatus("saved");
  };

  const deleteCurrentVersion = async () => {
    if (editorType !== "scene" || !editorId) return;
    if (editorVersionId === BASE_VERSION_ID) return;
    const scene = scenes.find((s) => s.id === editorId);
    if (!scene) return;

    const remaining = (scene.versions || []).filter((v) => v.id !== editorVersionId);
    const activeVersionId =
      scene.activeVersionId === editorVersionId ? BASE_VERSION_ID : scene.activeVersionId;

    await updateScene(projectId, selectedChapter.id, editorId, {
      versions: remaining,
      activeVersionId,
    });

    const baseTitle = scene.title || "Untitled Scene";
    const baseText = scene.text || "";
    const nextVersionId = activeVersionId || BASE_VERSION_ID;
    const nextTitle = nextVersionId === BASE_VERSION_ID ? baseTitle : editorTitle;
    const nextText = nextVersionId === BASE_VERSION_ID ? baseText : editorContent;

    setScenes((prev) =>
      prev.map((s) =>
        s.id === editorId
          ? { ...s, versions: remaining, activeVersionId, title: baseTitle, text: baseText }
          : s
      )
    );

    setEditorVersionId(nextVersionId);
    setEditorTitle(nextTitle);
    setEditorContent(nextText);
    setIsDirty(false);
    setSaveStatus("saved");
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
    loadIntoEditor("scene", newScene);
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
    loadIntoEditor("beat", newBeat);
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
  const currentScene = editorType === "scene" ? scenes.find((s) => s.id === editorId) : null;
  const editorVersionOptions = currentScene ? getVersionOptions(currentScene) : [];
  const activeVersionLabel =
    currentScene && currentScene.activeVersionId
      ? getVersionLabel(currentScene, currentScene.activeVersionId)
      : "Version 1";

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
                  className={`chapter-dropdown-item ${selectedChapter?.id === chapter.id ? "active" : ""
                    }`}
                  onClick={() => {
                    handleSelectChapter(chapter);
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
