import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { GripVertical, Trash2, Check, X } from "lucide-react";

/* -------------------------------
   SCENE ITEM
-------------------------------- */
export function SortableSceneItem({ scene, onChange, onSave, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: scene.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(scene.text);

  return (
    <div className="scene-item" ref={setNodeRef} style={style}>
      <div className="item-header">
        <span className="drag-handle" {...listeners} {...attributes}>
          <GripVertical size={18} />
        </span>

        {!editing && (
          <div className="item-actions">
            <button onClick={() => setEditing(true)}>✎</button>
            <button onClick={() => onDelete(scene.id)}>
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {!editing ? (
        <div className="scene-text">{scene.text || "(empty scene)"}</div>
      ) : (
        <>
          <textarea
            className="item-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="item-save-row">
            <button
              className="save-btn"
              onClick={() => {
                onSave(scene.id, text);
                setEditing(false);
              }}
            >
              <Check size={16} /> Save
            </button>

            <button className="cancel-btn" onClick={() => setEditing(false)}>
              <X size={16} /> Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------
   BEAT ITEM
-------------------------------- */
export function SortableBeatItem({ beat, onChange, onSave, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: beat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(beat.title || "");
  const [description, setDescription] = useState(beat.description || "");

  return (
    <div className="beat-item" ref={setNodeRef} style={style}>
      <div className="item-header">
        <span className="drag-handle" {...listeners} {...attributes}>
          <GripVertical size={18} />
        </span>

        {!editing && (
          <div className="item-actions">
            <button onClick={() => setEditing(true)}>✎</button>
            <button onClick={() => onDelete(beat.id)}>
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {!editing ? (
        <>
          <div className="item-title">{beat.title}</div>
          <div className="beat-description">{beat.description}</div>
        </>
      ) : (
        <>
          <input
            className="item-textarea"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="item-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="item-save-row">
            <button
              className="save-btn"
              onClick={() => {
                onSave({ ...beat, title, description });
                setEditing(false);
              }}
            >
              <Check size={16} />
              Save
            </button>

            <button className="cancel-btn" onClick={() => setEditing(false)}>
              <X size={16} />
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
