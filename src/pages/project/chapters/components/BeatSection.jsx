import React from "react";
import { Trash2, Link as LinkIcon, Unlink, Zap } from "lucide-react";
import "./BeatSection.css";

export default function BeatSection({
  beat,
  isEditing,
  onEdit,
  onDelete,
  onUnlink,
  onChangeLink,
  linkedScene,
}) {
  return (
    <div
      className={`card-section beat ${isEditing ? "editing" : ""}`}
      onClick={onEdit}
    >
      <div className="beat-list-card">
        <div className="beat-pill-icon">
          <Zap size={16} />
        </div>
        <div className="beat-pill-body">
          <div className="beat-pill-title">{beat.title || "Untitled Beat"}</div>
          <div className="beat-pill-sub">
            {linkedScene ? linkedScene.title || "Linked scene" : "No scene linked"}
          </div>
          <div className="beat-snippet">
            {beat.description || "No content yet..."}
          </div>
        </div>
        <div className="beat-pill-actions">
          {linkedScene ? (
            <button
              className="pill-btn"
              onClick={(e) => {
                e.stopPropagation();
                onUnlink();
              }}
              title="Unlink from scene"
            >
              <Unlink size={14} />
            </button>
          ) : (
            <button
              className="pill-btn"
              onClick={(e) => {
                e.stopPropagation();
                onChangeLink();
              }}
              title="Link to scene"
            >
              <LinkIcon size={14} />
            </button>
          )}
          <button
            className="pill-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete beat"
          >
            <Trash2 size={14} className="delete-card" />
          </button>
        </div>
      </div>
    </div>
  );
}
