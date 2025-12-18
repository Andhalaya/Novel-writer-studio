import React from "react";
import { Trash2, ChevronUp, ChevronDown, FileText, Zap, Link as LinkIcon, Unlink, Plus } from "lucide-react";
import "./SceneSection.css";

export default function SceneSection({
  scene,
  isEditing,
  onEdit,
  onDelete,
  onReorder,
  canMoveUp,
  canMoveDown,
  activeVersionLabel,
  displayContent,
  beat,
  onChangeLink,
  onUnlinkBeat,
  onDeleteBeat,
  onAddBeat,
}) {
  return (
    <div
      className={"card-section scene " + (isEditing ? "editing" : "")}
      onClick={onEdit}
    >
      <div className="card-header-wrapper scene">
        <div className="card-header">
          <div className="scene-avatar">
            <FileText size={18} />
          </div>
          <div className="card-title">
            <div className="card-title-text">
              {displayContent?.title || scene.title || "Untitled Scene"}
            </div>
            <div className="card-meta version-subtitle">
              {activeVersionLabel ? activeVersionLabel : "Version 1"}
            </div>
          </div>
        </div>
        <div className="card-actions subtle">
          {onReorder && (
            <>
              <button
                className="card-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onReorder("up");
                }}
                disabled={!canMoveUp}
                title="Move up"
              >
                <ChevronUp size={14} />
              </button>
              <button
                className="card-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onReorder("down");
                }}
                disabled={!canMoveDown}
                title="Move down"
              >
                <ChevronDown size={14} />
              </button>
            </>
          )}
          <button
            className="card-menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete scene"
          >
            <Trash2 size={16} className="delete-card" />
          </button>
        </div>
      </div>

      <div className="card-content scene-snippet">
        {displayContent?.text || scene.text || "No content yet..."}
      </div>

      {beat && (
        <div className="nested-beat-pill" onClick={(e) => e.stopPropagation()}>
          <div className="beat-pill-icon">
            <Zap size={14} />
          </div>
          <div className="beat-pill-body">
            <div className="beat-pill-title">{beat.title || "Untitled Beat"}</div>
            <div className="beat-pill-sub">
              {beat.sceneTitle || (scene.title ? `${scene.title}` : "Linked beat")}
            </div>
          </div>
          <div className="beat-pill-actions">
            <button
              className="pill-btn"
              title="Unlink"
              onClick={() => onUnlinkBeat && onUnlinkBeat()}
            >
              <Unlink size={14} />
            </button>
            <button
              className="pill-btn"
              title="Delete beat"
              onClick={() => onDeleteBeat && onDeleteBeat()}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}

      {!beat && onAddBeat && (
        <div className="add-beat-inline" onClick={(e) => e.stopPropagation()}>
          <button className="add-beat-inline-btn" onClick={onAddBeat}>
            <Plus size={16} />
            <span>Add Beat</span>
          </button>
        </div>
      )}
    </div>
  );
}
