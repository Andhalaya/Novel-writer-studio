import { useEffect, useState, useCallback } from "react";

export function useChapterData(projectId, api) {
  const {
    getChapters,
    getScenes,
    getBeats,
    linkBeatToScene,
    unlinkBeat,
    reorderScenesWithBeats,
  } = api;

  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [beats, setBeats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadChapters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadChapters = async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      const chaptersData = await getChapters(projectId);
      setChapters(chaptersData);

      if (chaptersData.length > 0 && !selectedChapter) {
        await loadChapter(chaptersData[0]);
      }
    } catch (error) {
      console.error("Error al cargar capítulos:", error);
      alert("Error al cargar los capítulos. Por favor, recarga la página.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadChapter = useCallback(
    async (chapter) => {
      if (!chapter || !projectId) return;

      try {
        setIsLoading(true);
        setSelectedChapter(chapter);

        const [scenesData, beatsData] = await Promise.all([
          getScenes(projectId, chapter.id),
          getBeats(projectId, chapter.id),
        ]);

        setScenes(
          scenesData.map((s) => ({
            ...s,
            activeVersionId: s.activeVersionId || "base-version",
          }))
        );
        setBeats(beatsData);
      } catch (error) {
        console.error("Error al cargar capítulo:", error);
        alert("Error al cargar el capítulo. Inténtalo de nuevo.");
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, getScenes, getBeats]
  );

  const handleLinkBeat = async (beatId, sceneId) => {
    if (!selectedChapter || !projectId) return;

    try {
      // Verificar si la escena ya está vinculada a otro beat
      const existingLink = beats.find(
        (b) => b.linkedSceneId === sceneId && b.id !== beatId
      );

      if (existingLink) {
        alert(
          "Esta escena ya está vinculada a otro beat. Cada escena solo puede vincularse a un beat."
        );
        return;
      }

      await linkBeatToScene(projectId, selectedChapter.id, beatId, sceneId);

      setBeats((prev) =>
        prev.map((b) =>
          b.id === beatId ? { ...b, linkedSceneId: sceneId } : b
        )
      );
    } catch (error) {
      console.error("Error al vincular beat:", error);
      alert("Error al vincular el beat. Inténtalo de nuevo.");
    }
  };

  const handleUnlinkBeat = async (beatId) => {
    if (!selectedChapter || !projectId) return;

    try {
      await unlinkBeat(projectId, selectedChapter.id, beatId);

      setBeats((prev) =>
        prev.map((b) =>
          b.id === beatId ? { ...b, linkedSceneId: null } : b
        )
      );
    } catch (error) {
      console.error("Error al desvincular beat:", error);
      alert("Error al desvincular el beat. Inténtalo de nuevo.");
    }
  };

  const handleSceneReorder = async (dragIndex, dropIndex) => {
    if (!selectedChapter || !projectId) return;

    try {
      // Actualizar UI optimistamente
      const reordered = [...scenes];
      const [removed] = reordered.splice(dragIndex, 1);
      reordered.splice(dropIndex, 0, removed);
      setScenes(reordered);

      // Guardar en Firestore
      await reorderScenesWithBeats(
        projectId,
        selectedChapter.id,
        reordered,
        beats
      );

      // Recargar beats para asegurar sincronización
      const beatsData = await getBeats(projectId, selectedChapter.id);
      setBeats(beatsData);
    } catch (error) {
      console.error("Error al reordenar escenas:", error);
      alert("Error al reordenar. Inténtalo de nuevo.");

      // Recargar datos para restaurar estado correcto
      await loadChapter(selectedChapter);
    }
  };

  return {
    chapters,
    setChapters,
    selectedChapter,
    setSelectedChapter,
    scenes,
    setScenes,
    beats,
    setBeats,
    isLoading,
    loadChapters,
    loadChapter,
    handleLinkBeat,
    handleUnlinkBeat,
    handleSceneReorder,
  };
}