import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";

export default function FloatingAddMenu({ onAddScene, onAddBeat, onAddChapter }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("scroll", close);
    return () => window.removeEventListener("scroll", close);
  }, []);

  return (
    <div className="floating-add-wrap">
      <button
        className="floating-add-btn"
        onClick={() => setOpen((v) => !v)}
        title="Quick add"
      >
        <Plus size={18} />
      </button>
      {open && (
        <div
          className="floating-add-menu"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            className="floating-add-item"
            onClick={() => {
              onAddScene();
              setOpen(false);
            }}
          >
            + Add Scene
          </button>
          <button
            className="floating-add-item"
            onClick={() => {
              onAddBeat();
              setOpen(false);
            }}
          >
            + Add Beat
          </button>
          <button
            className="floating-add-item"
            onClick={() => {
              onAddChapter();
              setOpen(false);
            }}
          >
            + Add Chapter
          </button>
        </div>
      )}
    </div>
  );
}
