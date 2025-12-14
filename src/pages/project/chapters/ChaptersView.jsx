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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Trash2,
  Edit2,
  Plus,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
// import NewSceneModal from "../../components/ui/NewSceneModal/NewSceneModal";
// import NewBeatModal from "../../components/ui/NewBeatModal/NewBeatModal";

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
  } = useFirestore();

  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [beats, setBeats] = useState([]);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [showSceneModal, setShowSceneModal] = useState(false);
  const [showBeatModal, setShowBeatModal] = useState(false);
  const [editingScene, setEditingScene] = useState(null);
  const [editingBeat, setEditingBeat] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  useEffect(() => {
    getChapters(projectId).then((data) => {
      setChapters(data);
      if (data.length > 0 && !selectedChapter) {
        loadChapterData(data[0]);
      }
    });
  }, [projectId]);

  const loadChapterData = async (chapter) => {
    setSelectedChapter(chapter);
    const [scenesData, beatsData] = await Promise.all([
      getScenes(projectId, chapter.id),
      getBeats(projectId, chapter.id),
    ]);
    setScenes(scenesData);
    setBeats(beatsData);
    setEditingScene(null);
    setEditingBeat(null);
  };

  const toggleExpand = (id) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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

  const handleSaveScene = async (sceneId, text) => {
    await updateScene(projectId, selectedChapter.id, sceneId, { text });
    setScenes((prev) =>
      prev.map((s) => (s.id === sceneId ? { ...s, text } : s))
    );
    setEditingScene(null);
  };

  const handleSaveBeat = async (beatId, title, description) => {
    await updateBeat(projectId, selectedChapter.id, beatId, {
      title,
      description,
    });
    setBeats((prev) =>
      prev.map((b) => (b.id === beatId ? { ...b, title, description } : b))
    );
    setEditingBeat(null);
  };

  const handleDeleteScene = async (sceneId) => {
    await deleteScene(projectId, selectedChapter.id, sceneId);
    setScenes((prev) => prev.filter((s) => s.id !== sceneId));
  };

  const handleDeleteBeat = async (beatId) => {
    await deleteBeat(projectId, selectedChapter.id, beatId);
    setBeats((prev) => prev.filter((b) => b.id !== beatId));
  };

  const maxRows = Math.max(scenes.length, beats.length, 1);
  const rows = Array.from({ length: maxRows }, (_, i) => ({
    scene: scenes[i] || null,
    beat: beats[i] || null,
  }));

  return (
    <div className="chapters-view-container">
      {/* LEFT SIDEBAR */}
      <aside className="chapters-sidebar">
        <h2 className="sidebar-header">Chapters</h2>
        <div className="chapters-list">
          {chapters.map((chapter) => (
            <div key={chapter.id} className="chapter-group">
              <div
                className={`chapter-item ${
                  selectedChapter?.id === chapter.id ? "active" : ""
                }`}
                onClick={() => loadChapterData(chapter)}
              >
                <button
                  className="expand-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(chapter.id);
                  }}
                >
                  {expandedChapters[chapter.id] ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                <span className="chapter-title">{chapter.title}</span>
              </div>

              {expandedChapters[chapter.id] && (
                <div className="beats-list">
                  {beats
                    .filter((b) => b.chapterId === chapter.id)
                    .map((beat) => (
                      <div key={beat.id} className="beat-list-item">
                        • {beat.title}
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="chapters-main">
        {!selectedChapter ? (
          <div className="empty-state">
            <p>Select a chapter to view scenes and beats</p>
          </div>
        ) : (
          <>
            <div className="content-header">
              <div className="column-label">
                <span>Scenes</span>
                <button
                  className="add-header-btn"
                  onClick={() => setShowSceneModal(true)}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="column-label">
                <span>Story Beats</span>
                <button
                  className="add-header-btn"
                  onClick={() => setShowBeatModal(true)}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="content-grid">
              {/* SCENES COLUMN */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEndScene}
              >
                <SortableContext
                  items={scenes.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="scenes-column">
                    {rows.map((row, index) => (
                      <div key={`scene-${index}`} className="content-cell">
                        {row.scene ? (
                          <SceneCard
                            scene={row.scene}
                            isEditing={editingScene === row.scene.id}
                            onEdit={() => setEditingScene(row.scene.id)}
                            onSave={(text) =>
                              handleSaveScene(row.scene.id, text)
                            }
                            onCancel={() => setEditingScene(null)}
                            onDelete={() => handleDeleteScene(row.scene.id)}
                          />
                        ) : (
                          <button
                            className="add-item-btn"
                            onClick={() => setShowSceneModal(true)}
                          >
                            <Plus size={18} />
                            <span>Add Scene</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* BEATS COLUMN */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEndBeat}
              >
                <SortableContext
                  items={beats.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="beats-column">
                    {rows.map((row, index) => (
                      <div key={`beat-${index}`} className="content-cell">
                        {row.beat ? (
                          <BeatCard
                            beat={row.beat}
                            isEditing={editingBeat === row.beat.id}
                            onEdit={() => setEditingBeat(row.beat.id)}
                            onSave={(title, description) =>
                              handleSaveBeat(row.beat.id, title, description)
                            }
                            onCancel={() => setEditingBeat(null)}
                            onDelete={() => handleDeleteBeat(row.beat.id)}
                          />
                        ) : (
                          <button
                            className="add-item-btn"
                            // onClick={() => setShowBeatModal(true)}
                          >
                            <Plus size={18} />
                            <span>Add Beat</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </>
        )}
      </main>

      {/* MODALS
      <NewSceneModal
        open={showSceneModal}
        onClose={() => setShowSceneModal(false)}
        chapterId={selectedChapter?.id}
        onCreated={() => loadChapterData(selectedChapter)}
      />

      <NewBeatModal
        open={showBeatModal}
        onClose={() => setShowBeatModal(false)}
        onCreated={() => selectedChapter && loadChapterData(selectedChapter)}
      /> */}
    </div>
  );
}

// SCENE CARD COMPONENT
function SceneCard({ scene, isEditing, onEdit, onSave, onCancel, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: scene.id });

  const [text, setText] = useState(scene.text || "");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="item-card scene-card">
      <div className="card-header">
        <span className="drag-handle" {...listeners} {...attributes}>
          <GripVertical size={18} />
        </span>
        <div className="card-actions">
          {!isEditing && (
            <>
              <button className="action-btn" onClick={onEdit}>
                <Edit2 size={16} />
              </button>
              <button className="action-btn delete" onClick={onDelete}>
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="edit-mode">
          <textarea
            className="edit-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe the scene..."
          />
          <div className="edit-actions">
            <button className="btn-save" onClick={() => onSave(text)}>
              Save
            </button>
            <button className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="card-content">
          <p className="scene-text">{scene.text || "No description"}</p>
        </div>
      )}
    </div>
  );
}

// BEAT CARD COMPONENT
function BeatCard({ beat, isEditing, onEdit, onSave, onCancel, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: beat.id });

  const [title, setTitle] = useState(beat.title || "");
  const [description, setDescription] = useState(beat.description || "");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="item-card beat-card">
      <div className="card-header">
        <span className="drag-handle" {...listeners} {...attributes}>
          <GripVertical size={18} />
        </span>
        <div className="card-actions">
          {!isEditing && (
            <>
              <button className="action-btn" onClick={onEdit}>
                <Edit2 size={16} />
              </button>
              <button className="action-btn delete" onClick={onDelete}>
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="edit-mode">
          <input
            className="edit-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Beat title..."
          />
          <textarea
            className="edit-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beat description..."
          />
          <div className="edit-actions">
            <button
              className="btn-save"
              onClick={() => onSave(title, description)}
            >
              Save
            </button>
            <button className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="card-content">
          <h4 className="beat-title">{beat.title}</h4>
          <p className="beat-description">{beat.description}</p>
          {beat.tags && beat.tags.length > 0 && (
            <div className="beat-tags">
              {beat.tags.map((tag, i) => (
                <span key={i} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}