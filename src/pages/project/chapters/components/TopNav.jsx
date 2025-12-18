import React from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";

export default function TopNav({ outlineOpen, setOutlineOpen }) {
  return (
    <div className="top-nav">
      <div className="nav-spacer" />
      <div
        className="outline-toggle-btn"
        onClick={() => setOutlineOpen && setOutlineOpen((v) => !v)}
        title={outlineOpen ? "Hide outline" : "Show outline"}
      >
        {outlineOpen ? <PanelRightClose size={25} /> : <PanelRightOpen size={25} />}
      </div>
    </div>
  );
}
