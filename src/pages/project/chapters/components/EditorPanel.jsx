import React from "react";
import { BASE_VERSION_ID } from "../../../../utils/versionUtils";
import { Save, FilePlus2, Upload, Trash2 } from "lucide-react";

export default function EditorPanel({
  editorType,
  editorTitle,
  setEditorTitle,
  editorContent,
  setEditorContent,
  editorVersionId,
  editorVersionOptions,
  activeVersionLabel,
  handleSelectVersion,
  saveCurrentVersion,
  saveNewVersion,
  addVersionToManuscript,
  deleteCurrentVersion,
  saveEditor,
  handleDeleteItem,
  setIsDirty,
  setSaveStatus,
  saveStatus,
  editorId,
}) {
  if (!editorType) {
    return (
      <div className="editor-empty">
        <div className="editor-empty-icon">No selection</div>
        <p className="editor-empty-text">Select a scene or beat to edit</p>
      </div>
    );
  }

  return (
    <>
      <div className="editor-header">
        <div className="editor-type-label" data-type={editorType}>
          {editorType === "scene" ? "Scene" : "Beat"}
        </div>
        <input
          type="text"
          className="editor-title-input"
          value={editorTitle}
          onChange={(e) => {
            setEditorTitle(e.target.value);
            setIsDirty(true);
            setSaveStatus("dirty");
          }}
          onBlur={() => {
            if (editorType === "scene") return;
            saveEditor();
          }}
          placeholder={(editorType === "scene" ? "Scene" : "Beat") + " title..."}
        />
        {editorType === "scene" && (
          <div className="version-select-row">
            <label className="version-label">Version</label>
            <select
              className="version-select"
              value={editorVersionId || BASE_VERSION_ID}
              onChange={(e) => handleSelectVersion(editorId, e.target.value)}
            >
              {editorVersionOptions.map((opt, idx) => (
                <option key={opt.id || idx} value={opt.id || BASE_VERSION_ID}>
                  {opt.label || opt.title || "Version " + (idx + 1)}
                </option>
              ))}
            </select>
            <div className="version-badge">In manuscript: {activeVersionLabel}</div>
          </div>
        )}
        <div className="editor-toolbar">
          {editorType === "scene" ? (
            <>
              <button className="toolbar-btn" onClick={saveCurrentVersion}>
                <Save size={16} /> Save
              </button>
              <button className="toolbar-btn" onClick={saveNewVersion}>
                <FilePlus2 size={16} /> Save as New Version
              </button>
              <button className="toolbar-btn" onClick={addVersionToManuscript}>
                <Upload size={16} /> Add to Manuscript
              </button>
              <button
                className="toolbar-btn delete"
                onClick={deleteCurrentVersion}
                disabled={editorVersionId === BASE_VERSION_ID}
                title={
                  editorVersionId === BASE_VERSION_ID
                    ? "Base version cannot be deleted"
                    : "Delete this version"
                }
              >
                <Trash2 size={16} /> Delete Version
              </button>
            </>
          ) : (
            <button className="toolbar-btn" onClick={saveEditor}>
              <Save size={16} /> Save
            </button>
          )}
          <button
            className="toolbar-btn delete"
            onClick={() => handleDeleteItem(editorType, editorId)}
          >
            <Trash2 size={16} /> Delete
          </button>
          {saveStatus !== "idle" && (
            <div className={`save-status ${saveStatus}`}>
              {saveStatus === "dirty" && "Not saved"}
              {saveStatus === "saved" && "Saved"}
              {saveStatus === "autosaved" && "Auto-saved"}
            </div>
          )}
        </div>
      </div>

      <div className="editor-content">
        <textarea
          className="editor-textarea"
          value={editorContent}
          onChange={(e) => {
            setEditorContent(e.target.value);
            setIsDirty(true);
            setSaveStatus("dirty");
          }}
          placeholder={`Write your ${editorType} here...`}
        />
      </div>
    </>
  );
}
