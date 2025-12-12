import React, { useState } from "react";
import "./NewBeatModal.css";
import { useFirestore } from "../../../context/FirestoreContext";
import { useParams } from "react-router-dom";

export default function NewBeatModal({ open, onClose, onCreated }) {
  const { createBeat } = useFirestore();
  const { projectId } = useParams();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalTitle = title.trim() || "Beat";

    await createBeat(projectId, onCreated().id, {
      title: finalTitle,
      description,
      orderIndex: Date.now(),
    });

    onCreated();
    onClose();
  };

  return (
    <div className="nb-overlay">
      <div className="nb-modal">

        <h2 className="nb-title">Add Beat</h2>

        <input
          className="nb-input"
          placeholder="Beat title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="nb-textarea"
          placeholder="Beat description (each line becomes a point)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {error && <p className="nb-error">{error}</p>}

        <div className="nb-actions">
          <button onClick={onClose} className="nb-btn-secondary">
            Cancel
          </button>
          <button onClick={handleSubmit} className="nb-btn-primary">
            Add Beat
          </button>
        </div>

      </div>
    </div>
  );
}
