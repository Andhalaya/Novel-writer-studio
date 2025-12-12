import React, { useState } from "react";
import "./NewProjectModal.css";
import { useFirestore } from "../../../context/FirestoreContext";

function NewProjectModal({ open, onClose, onCreated }) {
  const { createProject } = useFirestore();

  const [title, setTitle] = useState("");
  const [goalWordCount, setGoalWordCount] = useState("");
  const [status, setStatus] = useState("Planning");
  const [error, setError] = useState("");

  if (!open) return null; // Modal not visible

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    const projectData = {
      title,
      status,
      goalWordCount: Number(goalWordCount) || 0,
      currentWordCount: 0,
      lastEdited: new Date().toISOString().slice(0, 10),
    };

    try {
      const docRef = await createProject(projectData);
      onCreated?.(docRef.id); // optional callback
      onClose();
    } catch (err) {
      console.error(err);
      setError("Could not create project.");
    }
  };

  return (
    <div className="np-overlay">
      <div className="np-modal">
        <h1 className="np-title">New Project</h1>

        <form className="np-form" onSubmit={handleSubmit}>
          <label className="np-field">
            <span>Project Title</span>
            <input
              type="text"
              className="np-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your novel title..."
            />
          </label>

          <label className="np-field">
            <span>Goal Word Count</span>
            <input
              type="number"
              className="np-input"
              value={goalWordCount}
              onChange={(e) => setGoalWordCount(e.target.value)}
              placeholder="80000"
            />
          </label>

          <label className="np-field">
            <span>Status</span>
            <select
              className="np-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Planning">Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </label>

          {error && <p className="np-error">{error}</p>}

          <div className="np-actions">
            <button
              type="button"
              className="np-btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>

            <button type="submit" className="np-btn-primary">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewProjectModal;
