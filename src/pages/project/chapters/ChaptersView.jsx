import React, { useState, useEffect } from "react";
import "./ChaptersView.css";

import { useParams } from "react-router-dom";
import { useFirestore } from "../../../context/FirestoreContext";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import {
  SortableBeatItem,
  SortableSceneItem,
} from "./SortableItems";

import NewSceneModal from "../../../components/ui/NewSceneModal/NewSceneModal";
import NewBeatModal from "../../../components/ui/NewBeatModal/NewBeatModal";

import { Plus } from "lucide-react";


export default function ChaptersView() {
  const { projectId } = useParams();
  const {
    getChapters,
    getBeats,
    getScenes,
    updateBeat,
    updateScene,
    deleteScene,
    deleteBeat,
    createScene,
    createBeat,
  } = useFirestore();

  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);

  const [scenes, setScenes] = useState([]);
  const [beats, setBeats] = useState([]);

  const [expandedChapters, setExpandedChapters] = useState({});
  const [showSceneModal, setShowSceneModal] = useState(false);
  const [showBeatModal, setShowBeatModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  /* ----------------------------
      LOAD CHAPTERS
  ----------------------------- */
  useEffect(() => {
    getChapters(projectId).then(setChapters);
  }, [projectId]);

  /* ----------------------------
      LOAD SCENES + BEATS
  ----------------------------- */
  const loadChapterData = (chapter) => {
    setSelectedChapter(chapter);

    getScenes(projectId, chapter.id).then(setScenes);
    getBeats(projectId, chapter.id).then(setBeats);
  };

  /* ----------------------------
      EXPAND / COLLAPSE
  ----------------------------- */
  const toggleExpand = (id) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  /* ----------------------------
      DRAG HANDLERS
  ----------------------------- */

  const handleDragEndScene = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = scenes.findIndex((s) => s.id === active.id);
    const newIndex = scenes.findIndex((s) => s.id === over.id);

    const reordered = arrayMove(scenes, oldIndex, newIndex);

    setScenes(reordered);

    reordered.forEach((scene, idx) => {
      updateScene(projectId, selectedChapter.id, scene.id, { orderIndex: idx });
    });
  };

  const handleDragEndBeat = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = beats.findIndex((b) => b.id === active.id);
    const newIndex = beats.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(beats, oldIndex, newIndex);

    setBeats(reordered);

    reordered.forEach((beat, idx) => {
      updateBeat(projectId, selectedChapter.id, beat.id, { orderIndex: idx });
    });
  };

  /* ----------------------------
      INLINE EDIT SCENE
  ----------------------------- */
  const handleSceneChange = (id, newText) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, text: newText } : s))
    );
  };

  const saveScene = (id, text) => {
    updateScene(projectId, selectedChapter.id, id, { text });
  };

  /* ----------------------------
      INLINE EDIT BEAT
  ----------------------------- */
  const handleBeatChange = (id, field, value) => {
    setBeats((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, [field]: value } : b
      )
    );
  };

  const saveBeat = (beat) => {
    let title = beat.title?.trim();
    if (!title) {
      const idx = beats.findIndex((b) => b.id === beat.id);
      title = `Beat ${idx + 1}`;
    }

    updateBeat(projectId, selectedChapter.id, beat.id, {
      title,
      description: beat.description || "",
    });
  };

  /* ----------------------------
      ALIGN ROWS
  ----------------------------- */

  const rowCount = Math.max(scenes.length, beats.length);

  const rows = Array.from({ length: rowCount }, (_, i) => ({
    scene: scenes[i] || null,
    beat: beats[i] || null,
  }));

  /* ----------------------------
      ADD EMPTY CELL HANDLERS
  ----------------------------- */

  const handleAddSceneInRow = async () => {
    setShowSceneModal(true);
  };

  const handleAddBeatInRow = async () => {
    setShowBeatModal(true);
  };

  /* ----------------------------
      DELETE HANDLERS
  ----------------------------- */

  const handleDeleteScene = (id) => {
    deleteScene(projectId, selectedChapter.id, id).then(() =>
      setScenes((prev) => prev.filter((s) => s.id !== id))
    );
  };

  const handleDeleteBeat = (id) => {
    deleteBeat(projectId, selectedChapter.id, id).then(() =>
      setBeats((prev) => prev.filter((b) => b.id !== id))
    );
  };

  /* ----------------------------
      RENDER
  ----------------------------- */

  return (
    <div className="chapterview-container">

      {/* LEFT SIDEBAR */}
      <div className="chapterview-sidebar">

        <h2 className="cv-sidebar-title">Chapters</h2>

        {chapters.map((ch) => (
          <div key={ch.id} className="cv-chapter-item">

            <div className="cv-chapter-header">
              <button
                className="cv-expand-btn"
                onClick={() => toggleExpand(ch.id)}
              >
                {expandedChapters[ch.id] ? "▼" : "►"}
              </button>

              <div
                className="cv-chapter-title"
                onClick={() => loadChapterData(ch)}
              >
                {ch.title}
              </div>
            </div>

            {expandedChapters[ch.id] && (
              <div className="cv-chapter-subinfo">
                {ch.beatCount || 0} beats
              </div>
            )}
          </div>
        ))}

      </div>

      {/* RIGHT SIDE */}
      <div className="chapterview-main">

        {!selectedChapter ? (
          <div className="cv-empty">Select a chapter</div>
        ) : (
          <div className="cv-two-columns">

            <div className="cv-column-titles">
              <div>Scenes</div>
              <div>Beats</div>
            </div>

            <div className="cv-grid">

              {/* SCENE DRAG ZONE */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEndScene}
              >
                <SortableContext
                  items={scenes.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {/* BEAT DRAG ZONE */}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEndBeat}
                  >
                    <SortableContext
                      items={beats.map(b => b.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {/* RENDER SYNCHRONIZED ROWS */}
                      {rows.map((row, index) => (
                        <div className="cv-row" key={index}>

                          {/* SCENE CELL */}
                          <div className="cv-cell">
                            {row.scene ? (
                              <SortableSceneItem
                                scene={row.scene}
                                index={index}
                                onChange={handleSceneChange}
                                onSave={saveScene}
                                onDelete={handleDeleteScene}
                              />
                            ) : (
                              <button
                                className="cv-add-btn"
                                onClick={() => setShowSceneModal(true)}
                              >
                                + Add Scene
                              </button>
                            )}
                          </div>

                          {/* BEAT CELL */}
                          <div className="cv-cell">
                            {row.beat ? (
                              <SortableBeatItem
                                beat={row.beat}
                                index={index}
                                onChange={handleBeatChange}
                                onSave={saveBeat}
                                onDelete={handleDeleteBeat}
                              />
                            ) : (
                              <button
                                className="cv-add-btn"
                                onClick={() => setShowBeatModal(true)}
                              >
                                + Add Beat
                              </button>
                            )}
                          </div>

                        </div>
                      ))}
                    </SortableContext>
                  </DndContext>
                </SortableContext>
              </DndContext>

            </div>
          </div>

        )}
      </div>

      {/* MODALS */}
      <NewSceneModal
        open={showSceneModal}
        onClose={() => setShowSceneModal(false)}
        chapterId={selectedChapter?.id}
        onCreated={() => loadChapterData(selectedChapter)}
      />

      <NewBeatModal
        open={showBeatModal}
        onClose={() => setShowBeatModal(false)}
        onCreated={() => loadChapterData(selectedChapter)}
      />

    </div>
  );
}
