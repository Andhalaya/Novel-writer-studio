import { useEffect, useState, useRef, useCallback } from "react";
import {
  BASE_VERSION_ID,
  getVersionOptions,
  getVersionById,
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

  const saveIntervalRef = useRef(null);
  const lastSaveRef = useRef({ title: "", content: "" });

  // Autosave for beats (scenes use explicit saves/versions)
  useEffect(() => {
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }

    if (!editorType || !editorId || !selectedChapter || editorType === "scene") {
      return;
    }

    saveIntervalRef.current = setInterval(async () => {
      if (!isDirty) return;
      if (
        lastSaveRef.current.title === editorTitle &&
        lastSaveRef.current.content === editorContent
      ) {
        return;
      }

      try {
        await updateBeat(projectId, selectedChapter.id, editorId, {
          description: editorContent,
          title: editorTitle,
        });

        setBeats((prev) =>
          prev.map((b) =>
            b.id === editorId ? { ...b, description: editorContent, title: editorTitle } : b
          )
        );

        lastSaveRef.current = { title: editorTitle, content: editorContent };
        setIsDirty(false);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        console.error("Autosave error:", error);
        setSaveStatus("error");
      }
    }, 10000);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
    };
  }, [
    editorType,
    editorId,
    selectedChapter?.id,
    isDirty,
    editorTitle,
    editorContent,
    projectId,
    setBeats,
    updateBeat,
  ]);

  const loadIntoEditor = useCallback(
    (type, item, versionId = null, onEditingItemChange) => {
      setEditorType(type);
      setEditorId(item.id);

      if (type === "scene") {
        const options = getVersionOptions(item);
        const activeId = versionId || item.activeVersionId || BASE_VERSION_ID;
        const activeVersion =
          options.find((v) => v.id === activeId) || options[0] || {};

        setEditorVersionId(activeVersion.id || BASE_VERSION_ID);
        setEditorTitle(activeVersion.title || item.title || "Untitled Scene");
        setEditorContent(activeVersion.text || item.text || "");
      } else {
        setEditorTitle(item.title || "Untitled Beat");
        setEditorContent(item.description || "");
      }

      if (onEditingItemChange) {
        onEditingItemChange({ type, id: item.id });
      }

      lastSaveRef.current = {
        title: item.title || "",
        content: type === "scene" ? item.text || "" : item.description || "",
      };
      setIsDirty(false);
      setSaveStatus("idle");
    },
    []
  );

  const saveCurrentVersion = async () => {
    if (editorType !== "scene" || !editorId || !selectedChapter) return;

    try {
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
            ? { ...v, title: editorTitle, text: editorContent }
            : v
        );

        await updateScene(projectId, selectedChapter.id, editorId, {
          versions: updatedVersions,
        });

        setScenes((prev) =>
          prev.map((s) =>
            s.id === editorId ? { ...s, versions: updatedVersions } : s
          )
        );
      }

      setIsDirty(false);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Error saving version:", error);
      setSaveStatus("error");
    }
  };

  const saveNewVersion = async () => {
    if (editorType !== "scene" || !editorId || !selectedChapter) return;

    try {
      const scene = scenes.find((s) => s.id === editorId);
      if (!scene) return;

      const nextVersionNumber = (scene.versions?.length || 0) + 2; // base is version 1
      const versionLabel = `Version ${nextVersionNumber}`;

      const nextVersions = [
        {
          id: `ver-${Date.now()}`,
          label: versionLabel,
          title: editorTitle,
          text: editorContent || "",
          createdAt: new Date().toISOString(),
        },
        ...(scene.versions || []),
      ];

      await updateScene(projectId, selectedChapter.id, editorId, {
        versions: nextVersions,
      });

      setScenes((prev) =>
        prev.map((s) =>
          s.id === editorId ? { ...s, versions: nextVersions } : s
        )
      );

      setEditorVersionId(nextVersions[0].id);
      setIsDirty(false);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Error creating version:", error);
      setSaveStatus("error");
    }
  };

  const addVersionToManuscript = async () => {
    if (editorType !== "scene" || !editorId || !selectedChapter) return;

    try {
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
            ? { ...v, title: editorTitle, text: editorContent }
            : v
        );

        const selectedVersion =
          getVersionById({ ...scene, versions: updatedVersions }, editorVersionId) ||
          updatedVersions.find((v) => v.id === editorVersionId);

        // Prefer the content/title of the selected version (which we just updated),
        // even if the strings are empty, so we don't fall back to base text.
        const manuscriptTitle =
          (selectedVersion && selectedVersion.title !== undefined
            ? selectedVersion.title
            : editorTitle !== undefined
            ? editorTitle
            : scene.title) || "Untitled Scene";

        const manuscriptText =
          selectedVersion && selectedVersion.text !== undefined
            ? selectedVersion.text
            : editorContent !== undefined
            ? editorContent
            : scene.text || "";

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
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Error adding version to manuscript:", error);
      setSaveStatus("error");
    }
  };

  const deleteCurrentVersion = async () => {
    if (editorType !== "scene" || !editorId || !selectedChapter) return;
    if (editorVersionId === BASE_VERSION_ID) {
      alert("Base version cannot be deleted.");
      return;
    }

    if (!window.confirm("Delete this version?")) return;

    try {
      const scene = scenes.find((s) => s.id === editorId);
      if (!scene) return;

      const remaining = (scene.versions || []).filter(
        (v) => v.id !== editorVersionId
      );

      let newActiveVersionId = scene.activeVersionId;
      if (scene.activeVersionId === editorVersionId) {
        newActiveVersionId = BASE_VERSION_ID;
      }

      await updateScene(projectId, selectedChapter.id, editorId, {
        versions: remaining,
        activeVersionId: newActiveVersionId,
      });

      let nextTitle;
      let nextText;
      let nextVersionId;

      if (newActiveVersionId === BASE_VERSION_ID) {
        nextVersionId = BASE_VERSION_ID;
        nextTitle = scene.title || "Untitled Scene";
        nextText = scene.text || "";
      } else {
        const nextVersion = remaining.find((v) => v.id === newActiveVersionId);
        if (nextVersion) {
          nextVersionId = nextVersion.id;
          nextTitle = nextVersion.title || "Untitled Scene";
          nextText = nextVersion.text || "";
        } else {
          nextVersionId = BASE_VERSION_ID;
          nextTitle = scene.title || "Untitled Scene";
          nextText = scene.text || "";
        }
      }

      setScenes((prev) =>
        prev.map((s) =>
          s.id === editorId
            ? {
                ...s,
                versions: remaining,
                activeVersionId: newActiveVersionId,
              }
            : s
        )
      );

      setEditorVersionId(nextVersionId);
      setEditorTitle(nextTitle);
      setEditorContent(nextText);
      setIsDirty(false);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Error deleting version:", error);
      setSaveStatus("error");
      alert("Error deleting the version. Please try again.");
    }
  };

  const saveEditor = async () => {
    if (!editorType || !editorId || !selectedChapter) return;

    try {
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

      lastSaveRef.current = { title: editorTitle, content: editorContent };
      setIsDirty(false);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Error saving:", error);
      setSaveStatus("error");
      alert("Error saving. Please try again.");
    }
  };

  const handleSelectVersion = useCallback(
    (sceneId, versionId) => {
      const scene = scenes.find((s) => s.id === sceneId);
      if (!scene) return;
      loadIntoEditor("scene", scene, versionId);
    },
    [scenes, loadIntoEditor]
  );

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
