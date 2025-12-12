import React, { useState } from "react";
import "./NewChapterModal.css";
import { useFirestore } from "../../../context/FirestoreContext";
import { useParams } from "react-router-dom";

function NewChapterModal({ open, onClose, onCreated }) {
  const { createChapter } = useFirestore();
  const { projectId } = useParams();

  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Chapter title is required.");
      return;
    }

    const chapterData = {
      title,
      wordCount: 0,
      status: "Planned",
      orderIndex: Date.now(),
    };

    try {
      await createChapter(projectId, chapterData);
      onCreated?.(); // tell parent to refresh
      onClose();
    } catch (err) {
      console.error(err);
      setError("Could not create chapter.");
    }
  };

  return (
    <div className="nc-overlay">
      <div className="nc-modal">
        
        <h2 className="nc-title">New Chapter</h2>

        <form className="nc-form" onSubmit={handleSubmit}>
          
          <label className="nc-field">
            <span>Chapter Title</span>
            <input
              type="text"
              className="nc-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter chapter title..."
            />
          </label>

          {error && <p className="nc-error">{error}</p>}

          <div className="nc-actions">
            <button type="button" className="nc-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="nc-btn-primary">
              Create Chapter
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default NewChapterModal;
