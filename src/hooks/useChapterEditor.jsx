import { useEffect, useState } from "react";
import {
  BASE_VERSION_ID,
  getVersionOptions,
} from "../utils/versionUtils";

export function useChapterEditor({
  projectId,
  selectedChapter,
  scenes,
  setScenes,
  beats,
  setBeats,
  updateScene,
  updateBeat,
}) {
  const [editorTitle, setEditorTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorType, setEditorType] = useState(null);
  const [editorId, setEditorId] = useState(null);
  const [editorVersionId, setEditorVersionId] = useState(BASE_VERSION_ID);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");

  // Autosave for beats only (scenes use explicit version saves)
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
          b.id === editorId ? { ...b, description: editorContent, title: editorTitle } : b
        )
      );

      setIsDirty(false);
      setSaveStatus("saved");
    }, 10000);

    return () => clearInterval(interval);
  }, [editorType, editorId, selectedChapter?.id, isDirty, editorTitle, editorContent, projectId, setBeats, updateBeat]);

  const loadIntoEditor = (type, item, versionId = null, onEditingItemChange) => {
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
    if (onEditingItemChange) {
      onEditingItemChange({ type, id: item.id });
    }
    setIsDirty(false);
    setSaveStatus("idle");
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
        prev.map((s) =>
          s.id === editorId
            ? { ...s, versions: updatedVersions }
            : s
        )
      );
    }

    setIsDirty(false);
    setSaveStatus("saved");
  };

  const saveNewVersion = async () => {
    if (editorType !== "scene" || !editorId) return;
    const scene = scenes.find((s) => s.id === editorId);
    if (!scene) return;

    const nextVersionNumber = (scene.versions?.length || 0) + 2; // base is version 1
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
      prev.map((s) =>
        s.id === editorId ? { ...s, versions: nextVersions } : s
      )
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

  const handleSelectVersion = (sceneId, versionId) => {
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) return;
    loadIntoEditor("scene", scene, versionId);
  };

  return {
    editorTitle,
    setEditorTitle,
    editorContent,
    setEditorContent,
    editorType,
    editorId,
    editorVersionId,
    setEditorVersionId,
    isDirty,
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
  };
}
