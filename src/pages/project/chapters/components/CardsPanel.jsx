import React from "react";
import { BookOpen } from "lucide-react";

export default function CardsPanel({ selectedChapter, scenes, beats, renderCards, style }) {
  return (
    <div className="cards-panel" style={style}>
      {!selectedChapter ? (
        <div className="empty-state">
          <div className="empty-icon">✨</div>
          <p className="empty-text">Select a chapter to begin</p>
        </div>
      ) : scenes.length === 0 && beats.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✨</div>
          <p className="empty-text">No scenes or beats yet</p>
          <p className="empty-hint">Add a scene or a beat to start</p>
        </div>
      ) : (
        renderCards()
      )}
    </div>
  );
}
