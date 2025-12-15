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
      <div className="card-header-wrapper scene">
      <div className="card-header">
        <span className="scene-icon">📃</span>
        <div className="card-title">      
          <div className="card-title-text">
           {displayContent?.title || scene.title || "Untitled Scene"}
          </div>
          <div className="card-meta version-subtitle">
            {activeVersionLabel ? activeVersionLabel : "Version 1"}
          </div>
          {scene.location && (
            <div className="card-meta">
              {scene.location}. {scene.time || "Unspecified time"}
            </div>
          )}
        </div>
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
          >
            <Trash2 size={16} className="delete-card"/>
          </button>
        </div>
      </div>
      
      <div className="card-content">
        {displayContent?.text || scene.text || "No content yet..."}
      </div>
    </div>
  );
}
