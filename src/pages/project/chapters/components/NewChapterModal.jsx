import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";

export default function NewChapterModal({ isOpen, onClose, chapter, onSave }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "draft",
    targetWordCount: 3000,
  });

  const [errors, setErrors] = useState({});

  // Update form when chapter prop changes
  useEffect(() => {
    if (chapter) {
      setFormData({
        title: chapter.title || "",
        description: chapter.description || "",
        status: chapter.status || "draft",
        targetWordCount: chapter.targetWordCount || 3000,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        status: "draft",
        targetWordCount: 3000,
      });
    }
    setErrors({});
  }, [chapter, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (formData.targetWordCount < 0) {
      newErrors.targetWordCount = "Target word count must be positive";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSave({
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
    });
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      status: "draft",
      targetWordCount: 3000,
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {chapter ? "Edit Chapter" : "New Chapter"}
          </h2>
          <button
            onClick={handleClose}
            className="modal-close-btn"
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Title */}
          <div className="form-group">
            <label className="form-label">
              Chapter Title <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`form-input ${errors.title ? "input-error" : ""}`}
              placeholder="e.g., The Journey Begins"
              autoFocus
            />
            {errors.title && (
              <span className="error-message">{errors.title}</span>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-textarea"
              placeholder="Brief summary of what happens in this chapter..."
              rows={3}
            />
            <p className="form-hint">
              Optional: Add a brief summary or notes about this chapter
            </p>
          </div>

          {/* Status */}
          <div className="form-group">
            <label className="form-label">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="form-select"
            >
              <option value="draft">Draft</option>
              <option value="in-progress">In Progress</option>
              <option value="complete">Complete</option>
            </select>
          </div>

          {/* Target Word Count */}
          <div className="form-group">
            <label className="form-label">
              Target Word Count
            </label>
            <input
              type="number"
              value={formData.targetWordCount}
              onChange={(e) => setFormData({ 
                ...formData, 
                targetWordCount: parseInt(e.target.value) || 0 
              })}
              className={`form-input ${errors.targetWordCount ? "input-error" : ""}`}
              placeholder="3000"
              min="0"
            />
            {errors.targetWordCount && (
              <span className="error-message">{errors.targetWordCount}</span>
            )}
            <p className="form-hint">
              Optional: Set a word count goal for this chapter
            </p>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              <Save size={16} />
              {chapter ? "Save Changes" : "Create Chapter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}