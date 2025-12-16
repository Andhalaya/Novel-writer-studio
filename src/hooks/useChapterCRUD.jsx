import { useCallback } from "react";

/**
 * Centralized CRUD actions for chapters, scenes, and beats.
 * Exposes add/delete helpers so UI components stay lean.
 */
export function useChapterCRUD({
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
  openEditor, // callback from useChapterEditor wrapper to open the editor
  setEditingItem, // optional: clear editor when deleting
}) {
  const handleAddScene = useCallback(async () => {
    if (!selectedChapter) return null;

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
      if (openEditor) openEditor("scene", newScene);
      return newScene;
    } catch (error) {
      console.error("Error creating scene:", error);
      alert("Error creating the scene. Please try again.");
      return null;
    }
  }, [createScene, projectId, selectedChapter, scenes.length, setScenes, openEditor]);

  const handleAddBeat = useCallback(async () => {
    if (!selectedChapter) return null;

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
      if (openEditor) openEditor("beat", newBeat);
      return newBeat;
    } catch (error) {
      console.error("Error creating beat:", error);
      alert("Error creating the beat. Please try again.");
      return null;
    }
  }, [beats.length, createBeat, projectId, selectedChapter, setBeats, openEditor]);

  const handleAddBeatToScene = useCallback(
    async (sceneId) => {
      if (!selectedChapter) return null;

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
        if (openEditor) openEditor("beat", newBeat);
        return newBeat;
      } catch (error) {
        console.error("Error creating beat:", error);
        alert("Error creating the beat. Please try again.");
        return null;
      }
    },
    [beats.length, createBeat, projectId, selectedChapter, setBeats, openEditor]
  );

  const handleAddSceneAndBeatPair = useCallback(async () => {
    if (!selectedChapter) return null;

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
        }),
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

      if (openEditor) openEditor("scene", newScene);
      return { scene: newScene, beat: newBeat };
    } catch (error) {
      console.error("Error creating scene-beat pair:", error);
      alert("Error creating the pair. Please try again.");
      return null;
    }
  }, [
    beats.length,
    createBeat,
    createScene,
    openEditor,
    projectId,
    scenes.length,
    selectedChapter,
    setBeats,
    setScenes,
  ]);

  const handleDeleteItem = useCallback(
    async (type, id) => {
      if (!selectedChapter) return;
      if (!window.confirm(`Eliminar este ${type === "scene" ? "escena" : "beat"}?`)) return;

      try {
        if (type === "scene") {
          // Unlink beats pointing to this scene
          const linkedBeats = beats.filter((b) => b.linkedSceneId === id);
          for (const beat of linkedBeats) {
            await unlinkBeat(projectId, selectedChapter.id, beat.id);
          }

          await deleteScene(projectId, selectedChapter.id, id);
          setScenes((prev) => prev.filter((s) => s.id !== id));

          const updatedBeats = await getBeats(projectId, selectedChapter.id);
          setBeats(updatedBeats);
        } else {
          await deleteBeat(projectId, selectedChapter.id, id);
          setBeats((prev) => prev.filter((b) => b.id !== id));
        }

        if (setEditingItem) {
          setEditingItem((current) => (current?.id === id ? null : current));
        }
      } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        alert("Error deleting. Please try again.");
      }
    },
    [
      beats,
      deleteBeat,
      deleteScene,
      getBeats,
      projectId,
      selectedChapter,
      setBeats,
      setEditingItem,
      setScenes,
      unlinkBeat,
    ]
  );

  const handleDeleteChapter = useCallback(
    async (chapter) => {
      if (!chapter || !projectId) return;
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
    },
    [chapters, deleteChapter, loadChapter, projectId, selectedChapter, setBeats, setChapters, setScenes]
  );

  return {
    handleAddScene,
    handleAddBeat,
    handleAddBeatToScene,
    handleAddSceneAndBeatPair,
    handleDeleteItem,
    handleDeleteChapter,
  };
}
