import React from "react";

export default function OutlineDrawer({
  open,
  setOpen,
  chapters,
  scenesByChapter,
  expandedMap,
  onToggleChapter,
  onDeleteChapter,
}) {
  return (
    <div className={`outline-drawer ${open ? "open" : ""}`}>
      <div className="outline-toggle" onClick={() => setOpen(!open)}>
        <span>{open ? "Hide Outline" : "Show Outline"}</span>
      </div>
      {open && (
        <div className="outline-body">
          <div className="outline-header">Chapters</div>
          <div className="outline-list">
            {chapters
              .slice()
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((ch, idx) => {
                const expanded = expandedMap[ch.id];
                const sc = scenesByChapter[ch.id] || [];
                return (
                  <div key={ch.id} className="outline-chapter">
                    <div className="outline-chapter-row">
                      <button
                        className="outline-caret-btn"
                        onClick={() => onToggleChapter(ch)}
                        title={expanded ? "Collapse" : "Expand"}
                      >
                        {expanded ? "▾" : "▸"}
                      </button>
                      <div className="outline-chapter-meta">
                        <div className="outline-chapter-title">
                          Chapter {idx + 1}: {ch.title || "Untitled"}
                        </div>
                        <div className="outline-chapter-stats">
                          {ch.scenes?.length ?? sc.length ?? 0} scenes · {ch.beats?.length ?? 0} beats
                        </div>
                      </div>
                      <button
                        className="outline-delete-btn"
                        onClick={() => onDeleteChapter(ch)}
                        title="Delete chapter"
                      >
                        ×
                      </button>
                    </div>
                    {expanded && sc.length > 0 && (
                      <ul className="outline-scenes">
                        {sc.map((sceneItem, sidx) => (
                          <li key={sceneItem.id} className="outline-scene-item">
                            <span className="scene-dot" />
                            Scene {sidx + 1}: {sceneItem.title || "Untitled Scene"}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
