import { useEffect, useState } from "react";

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

  useEffect(() => {
    loadChapters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadChapters = async () => {
    const chaptersData = await getChapters(projectId);
    setChapters(chaptersData);
    if (chaptersData.length > 0 && !selectedChapter) {
      await loadChapter(chaptersData[0]);
    }
  };

  const loadChapter = async (chapter) => {
    if (!chapter) return;
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
  };

  const handleLinkBeat = async (beatId, sceneId) => {
    const existingLink = beats.find(
      (b) => b.linkedSceneId === sceneId && b.id !== beatId
    );
    if (existingLink) {
      alert(
        "This scene is already linked to another beat. Each scene can only be linked to one beat."
      );
      return;
    }

    await linkBeatToScene(projectId, selectedChapter.id, beatId, sceneId);
    setBeats((prev) =>
      prev.map((b) => (b.id === beatId ? { ...b, linkedSceneId: sceneId } : b))
    );
  };

  const handleUnlinkBeat = async (beatId) => {
    await unlinkBeat(projectId, selectedChapter.id, beatId);
    setBeats((prev) =>
      prev.map((b) => (b.id === beatId ? { ...b, linkedSceneId: null } : b))
    );
  };

  const handleSceneReorder = async (dragIndex, dropIndex) => {
    const reordered = [...scenes];
    const [removed] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, removed);
    setScenes(reordered);

    await reorderScenesWithBeats(projectId, selectedChapter.id, reordered, beats);
    const beatsData = await getBeats(projectId, selectedChapter.id);
    setBeats(beatsData);
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
    loadChapters,
    loadChapter,
    handleLinkBeat,
    handleUnlinkBeat,
    handleSceneReorder,
  };
}
