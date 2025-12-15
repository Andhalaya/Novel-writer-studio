import React from "react";
import { Trash2, Link as LinkIcon, Unlink, ArrowRightLeft } from "lucide-react";

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
      <div className="card-type-label beat">
        <ArrowRightLeft size={14} /> Beat
      </div>
      <div className="card-header">
        <div className="card-title">
          <div className="card-title-text">{beat.title || "Untitled Beat"}</div>
          {linkedScene && (
            <div className="card-meta">
              <LinkIcon size={12} />
              {linkedScene.title || "Untitled Scene"}
            </div>
          )}
        </div>
        <div className="card-actions">
          {linkedScene ? (
            <button
              className="card-action-btn"
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
              className="card-action-btn"
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
            className="card-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onChangeLink();
            }}
            title="Change linked scene"
          >
            <LinkIcon size={14} />
          </button>
          <button
            className="card-menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="card-content">{beat.description || "No content yet..."}</div>
    </div>
  );
}
