import React from "react";
import { Trash2, ChevronUp, ChevronDown, FileText } from "lucide-react";
import { BASE_VERSION_ID } from "../../../../utils/versionUtils";

export default function SceneSection({
  scene,
  isEditing,
  onEdit,
  onDelete,
  onReorder,
  canMoveUp,
  canMoveDown,
  activeVersionLabel,
  versionOptions,
  activeVersionId,
  onSelectVersion,
  displayContent,
}) {
  return (
    <div
      className={"card-section scene " + (isEditing ? "editing" : "")}
      onClick={onEdit}
    >
      <div className="card-type-label scene"><FileText size={14} /> Scene</div>
      <div className="card-header">
        <div className="card-title">
          <div className="card-title-text">
            {displayContent?.title || scene.title || "Untitled Scene"}
          </div>
          <div className="card-meta version-subtitle">
            {activeVersionLabel ? "Current: " + activeVersionLabel : "Version 1"}
          </div>
          {scene.location && (
            <div className="card-meta">
              {scene.location} ƒ?› {scene.time || "Unspecified time"}
            </div>
          )}
        </div>
        <div className="card-actions">
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
                🔼
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
               🔼
              </button>
            </>
          )}
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
      <div className="card-content">
        {displayContent?.text || scene.text || "No content yet..."}
      </div>
    </div>
  );
}



