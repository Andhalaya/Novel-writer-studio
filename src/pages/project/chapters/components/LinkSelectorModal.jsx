import React from "react";

export default function LinkSelectorModal({ scenes, currentBeatId, onLink, onClose }) {
  return (
    <div className="link-selector-overlay" onClick={onClose}>
      <div className="link-selector-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="link-selector-title">Link Beat to Scene</h3>
        <div className="link-selector-list">
          {scenes.map((scene) => (
            <button
              key={scene.id}
              className="link-selector-item"
              onClick={() => onLink(scene.id)}
            >
              <div className="link-selector-item-title">
                {scene.title || "Untitled Scene"}
              </div>
              <div className="link-selector-item-meta">
                {scene.location || "No location"}
              </div>
            </button>
          ))}
        </div>
        <button className="link-selector-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
