import React, { useState } from "react";
import "./NewSceneModal.css";
import { useFirestore } from "../../../context/FirestoreContext";
import { useParams } from "react-router-dom";

export default function NewSceneModal({ open, onClose, onCreated, chapterId }) {
  const { createScene } = useFirestore();
  const { projectId } = useParams();

  const [text, setText] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!text.trim()) {
      setError("Scene text cannot be empty.");
      return;
    }

    // CREATE SCENE — correct version
    await createScene(projectId, chapterId, {
      text,
      orderIndex: Date.now(),
    });

    // Refresh chapter data
    if (onCreated) {
      onCreated();
    }

    onClose();
  };

  return (
    <div className="ns-overlay">
      <div className="ns-modal">

        <h2 className="ns-title">Add Scene</h2>

        <textarea
          className="ns-textarea"
          placeholder="Write scene notes..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {error && <p className="ns-error">{error}</p>}

        <div className="ns-actions">
          <button onClick={onClose} className="ns-btn-secondary">Cancel</button>
          <button onClick={handleSubmit} className="ns-btn-primary">Add Scene</button>
        </div>

      </div>
    </div>
  );
}
