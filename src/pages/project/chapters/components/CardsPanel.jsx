import React from "react";

export default function CardsPanel({ selectedChapter, scenes, beats, renderCards }) {
  return (
    <div className="cards-panel">
      {!selectedChapter ? (
        <div className="empty-state">
          <div className="empty-icon">dY"-</div>
          <p className="empty-text">Select a chapter to begin</p>
        </div>
      ) : scenes.length === 0 && beats.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">ƒo"</div>
          <p className="empty-text">No scenes or beats yet</p>
          <p className="empty-hint">Click "Add Scene & Beat Pair" to start</p>
        </div>
      ) : (
        renderCards()
      )}
    </div>
  );
}
