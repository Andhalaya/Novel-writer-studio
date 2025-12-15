import React, { useState, useEffect, useRef, useCallback } from "react";
import "./ManuscriptView.css";
import { useParams, useNavigate } from "react-router-dom";
import { useFirestore } from "../../../context/FirestoreContext";
import {
  ChevronDown,
  Edit2,
  MessageSquare,
  Highlighter,
  X,
  ExternalLink,
} from "lucide-react";
import {
  BASE_VERSION_ID,
  getDisplayContent as getDisplayContentFromUtils,
} from "../../../utils/versionUtils";

const HIGHLIGHT_COLORS = {
  yellow: "rgba(254, 240, 138, 0.8)",
  green: "rgba(187, 247, 208, 0.65)",
  pink: "rgba(249, 168, 212, 0.65)",
};

const getDisplayScene = (scene) => getDisplayContentFromUtils(scene);

export default function ManuscriptView() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const {
    getChapters,
    getBeats,
    getScenes,
    updateScene,
    getComments,
    createComment,
    deleteComment,
    getHighlights,
    createHighlight,
    deleteHighlight,
  } = useFirestore();

  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [beats, setBeats] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedText, setSelectedText] = useState(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]); // { id, sceneId, text, selection, position }
  const [highlights, setHighlights] = useState([]); // { id, sceneId, text, color }
  const manuscriptRef = useRef(null);

  useEffect(() => {
    loadChapters();
  }, [projectId]);

  const loadChapters = async () => {
    const chaptersData = await getChapters(projectId);
    setChapters(chaptersData);
    if (chaptersData.length > 0 && !selectedChapter) {
      loadChapter(chaptersData[0]);
    }
  };

  const loadChapter = async (chapter) => {
    setSelectedChapter(chapter);

    const [scenesData, beatsData, commentsData, highlightsData] = await Promise.all([
      getScenes(projectId, chapter.id),
      getBeats(projectId, chapter.id),
      getComments(projectId, chapter.id),
      getHighlights(projectId, chapter.id),
    ]);

    setScenes(scenesData);
    setBeats(beatsData);
    setComments(commentsData);
    setHighlights(highlightsData);
  };

  const chapterNumber = selectedChapter
    ? chapters
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .findIndex((c) => c.id === selectedChapter.id) + 1
    : null;

  // Get beat for a scene
  const getBeatForScene = (sceneId) => {
    return beats.find((b) => b.linkedSceneId === sceneId);
  };

  // Calculate word count
  const getWordCount = (text) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).length;
  };

  const exportChapter = (chapterTitle, chapterScenes, chapterIndex = null) => {
    const lines = [];
    const headingPrefix =
      chapterIndex !== null ? `Chapter ${chapterIndex + 1}: ` : "";
    lines.push(`${headingPrefix}${chapterTitle || "Untitled Chapter"}`);
    lines.push("");
    chapterScenes.forEach((scene, idx) => {
      const display = getDisplayScene(scene);
      lines.push(display.text || "");
      if (idx !== chapterScenes.length - 1) {
        lines.push("");
      }
    });
    return lines.join("\n");
  };

  const triggerDownload = (filename, content) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportManuscript = useCallback(
    async (scope = "chapter") => {
      if (!selectedChapter) return;
      try {
        if (scope === "chapter") {
          const content = exportChapter(
            selectedChapter.title,
            scenes,
            chapterNumber ? chapterNumber - 1 : null
          );
          triggerDownload(`${selectedChapter.title || "chapter"}.txt`, content);
        } else {
          // Export full novel: fetch scenes for every chapter
          const chaptersSorted = [...chapters].sort((a, b) => a.orderIndex - b.orderIndex);
          const chapterScenesList = await Promise.all(
            chaptersSorted.map((ch) => getScenes(projectId, ch.id))
          );

          let novelContent = "";
          chaptersSorted.forEach((ch, idx) => {
            const chapterContent = exportChapter(ch.title, chapterScenesList[idx], idx);
            novelContent += chapterContent;
            if (idx !== chaptersSorted.length - 1) {
              novelContent += "\n\n";
            }
          });
          triggerDownload("novel.txt", novelContent.trim());
        }
      } catch (err) {
        console.error("Error exporting manuscript:", err);
        alert("Could not export. Please try again.");
      }
    },
    [selectedChapter, scenes, chapterNumber, chapters, getScenes, projectId]
  );

  const getTotalWordCount = () => {
    return scenes.reduce((total, scene) => {
      const display = getDisplayScene(scene);
      return total + getWordCount(display.text);
    }, 0);
  };

  useEffect(() => {
    const handleExportEvent = (e) => {
      const scope = e.detail?.scope || "chapter";
      handleExportManuscript(scope);
    };
    window.addEventListener("export-manuscript", handleExportEvent);
    return () => window.removeEventListener("export-manuscript", handleExportEvent);
  }, [handleExportManuscript]);

  // Handle text selection for comments/highlights
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().length === 0) {
      setSelectedText(null);
      return;
    }

    const anchorScene = selection.anchorNode?.parentElement?.closest?.("[data-scene-id]");
    const focusScene = selection.focusNode?.parentElement?.closest?.("[data-scene-id]");
    const sceneId =
      anchorScene &&
      focusScene &&
      anchorScene.getAttribute("data-scene-id") === focusScene.getAttribute("data-scene-id")
        ? anchorScene.getAttribute("data-scene-id")
        : null;

    if (!sceneId) {
      setSelectedText(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelectedText({
      text: selection.toString(),
      range,
      sceneId,
      position: {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
      },
    });
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedText?.sceneId) return;

    const sceneId = selectedText.sceneId;

    const commentData = {
      sceneId,
      text: commentText,
      selection: selectedText.text,
    };

    const docRef = await createComment(projectId, selectedChapter.id, commentData);
    
    const newComment = {
      id: docRef.id,
      ...commentData,
      createdAt: new Date(),
    };

    setComments([...comments, newComment]);
    setCommentText("");
    setShowCommentBox(false);
    setSelectedText(null);

  };

  const handleAddHighlight = async (color = "yellow") => {
    if (!selectedText?.sceneId) return;

    const highlightData = {
      sceneId: selectedText.sceneId,
      text: selectedText.text,
      color,
    };

    const docRef = await createHighlight(projectId, selectedChapter.id, highlightData);

    const newHighlight = {
      id: docRef.id,
      ...highlightData,
      createdAt: new Date(),
    };

    setHighlights([...highlights, newHighlight]);
    setSelectedText(null);
  };

  const handleDeleteHighlight = async (highlightId) => {
    await deleteHighlight(projectId, selectedChapter.id, highlightId);
    setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
  };

  const handleDeleteComment = async (commentId) => {
    await deleteComment(projectId, selectedChapter.id, commentId);
    setComments(comments.filter((c) => c.id !== commentId));
  };

  const navigateToEdit = (type, id) => {
    navigate(`/project/${projectId}/chapters`, {
      state: { openEditor: { type, id } },
    });
  };

  const renderHighlightedText = (text, sceneHighlights) => {
    if (!text) return null;
    if (!sceneHighlights.length) return text;

    let parts = [text];

    sceneHighlights.forEach((highlight) => {
      if (!highlight.text) return;
      const nextParts = [];

      parts.forEach((part) => {
        if (typeof part !== "string") {
          nextParts.push(part);
          return;
        }

        const matchIndex = part.indexOf(highlight.text);
        if (matchIndex === -1) {
          nextParts.push(part);
          return;
        }

        if (matchIndex > 0) {
          nextParts.push(part.slice(0, matchIndex));
        }

        nextParts.push({
          id: highlight.id,
          text: highlight.text,
          color: highlight.color || "yellow",
        });

        const remaining = part.slice(matchIndex + highlight.text.length);
        if (remaining) {
          nextParts.push(remaining);
        }
      });

      parts = nextParts;
    });

    return parts.map((part, idx) => {
      if (typeof part === "string") {
        return <React.Fragment key={`text-${idx}`}>{part}</React.Fragment>;
      }

      return (
        <mark
          key={`highlight-${part.id || idx}`}
          className="text-highlight"
          data-color={part.color}
          style={{ backgroundColor: HIGHLIGHT_COLORS[part.color] || HIGHLIGHT_COLORS.yellow }}
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteHighlight(part.id);
          }}
          title="Remove highlight"
        >
          {part.text}
        </mark>
      );
    });
  };

  return (
    <div className="manuscript-container">
      {/* Top Bar */}
      <div className="manuscript-header">
        <div className="chapter-selector">
          <button
            className="chapter-dropdown-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span>
              {selectedChapter
                ? `Chapter ${chapterNumber}`
                : "Select a chapter"}
            </span>
            <ChevronDown size={16} />
          </button>

          {dropdownOpen && (
            <div className="chapter-dropdown">
              {chapters.map((chapter, idx) => (
                <div
                  key={chapter.id}
                  className={`chapter-dropdown-item ${
                    selectedChapter?.id === chapter.id ? "active" : ""
                  }`}
                  onClick={() => {
                    loadChapter(chapter);
                    setDropdownOpen(false);
                  }}
                >
                  <div className="chapter-dropdown-title">
                    Chapter {idx + 1}
                  </div>
                  <div className="chapter-dropdown-meta">
                    {chapter.scenes?.length || 0} scenes
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedChapter && (
          <div className="chapter-stats">
            <div className="stat-item">
              <span className="stat-label">Scenes</span>
              <span className="stat-value">{scenes.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Words</span>
              <span className="stat-value">{getTotalWordCount()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Comments</span>
              <span className="stat-value">
                {comments.filter((c) =>
                  scenes.some((s) => s.id === c.sceneId)
                ).length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="manuscript-main">
        {!selectedChapter ? (
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <p className="empty-text">Select a chapter to view manuscript</p>
          </div>
        ) : (
          <>
            
            {/* Document Content */}
            <div
              className="manuscript-document"
              ref={manuscriptRef}
              onMouseUp={handleTextSelection}
            >
              <div className="document-title">
                {selectedChapter.title}
              </div>

              {scenes.map((scene, idx) => {
                const sceneComments = comments.filter(
                  (c) => c.sceneId === scene.id
                );
                const sceneHighlights = highlights.filter(
                  (h) => h.sceneId === scene.id
                );

                const display = getDisplayScene(scene);
                return (
                  <div key={scene.id} className="manuscript-scene">
                    <div className="scene-separator">
                      <span>Scene {idx + 1}</span>
                    </div>

                    <div className="scene-content">
                      {display.text ? (
                        <p className="scene-text" data-scene-id={scene.id}>
                          {renderHighlightedText(display.text, sceneHighlights)}
                        </p>
                      ) : (
                        <p className="scene-text empty">
                          [No content for this scene]
                        </p>
                      )}
                    </div>

                    {/* Scene Comments */}
                    {sceneComments.length > 0 && (
                      <div className="scene-comments">
                        {sceneComments.map((comment) => (
                          <div key={comment.id} className="comment-card">
                            <div className="comment-header">
                              <MessageSquare size={14} />
                              <span className="comment-selection">
                                "{comment.selection.substring(0, 30)}..."
                              </span>
                              <button
                                className="comment-delete"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <div className="comment-text">{comment.text}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
        {/* Beat Timeline Sidebar */}
            <div className="beat-timeline">
              <div className="timeline-header">
                <span>Story Beats</span>
              {scenes.map((scene, idx) => {
                const beat = getBeatForScene(scene.id);
                const display = getDisplayScene(scene);
                return (
                  <div key={scene.id} className="timeline-item">
                    <div className="timeline-marker">{idx + 1}</div>
                    <div className="timeline-content">
                      <div className="timeline-scene-title">
                        {display.title || `Scene ${idx + 1}`}
                      </div>
                      {beat && (
                        <div className="timeline-beat">
                          <div className="beat-title">{beat.title}</div>
                          <button
                            className="timeline-edit-btn"
                            onClick={() => navigateToEdit("beat", beat.id)}
                            title="Edit beat"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                      <div className="timeline-meta">
                        {getWordCount(display.text)} words
                      </div>
                      <button
                        className="timeline-edit-btn"
                        onClick={() => navigateToEdit("scene", scene.id)}
                        title="Edit scene"
                      >
                        <ExternalLink size={12} /> Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
      </div>

      {/* Selection Toolbar */}
      {selectedText && !showCommentBox && (
        <div
          className="selection-toolbar"
          style={{
            top: selectedText.position.top - 50,
            left: selectedText.position.left,
          }}
        >
          <button
            className="toolbar-action"
            onClick={() => setShowCommentBox(true)}
            title="Add comment"
          >
            <MessageSquare size={16} />
          </button>
          <button
            className="toolbar-action"
            onClick={() => handleAddHighlight("yellow")}
            title="Highlight"
          >
            <Highlighter size={16} />
          </button>
        </div>
      )}

      {/* Comment Box */}
      {showCommentBox && selectedText && (
        <div
          className="comment-box"
          style={{
            top: selectedText.position.top + 20,
            left: selectedText.position.left,
          }}
        >
          <textarea
            className="comment-input"
            placeholder="Add your comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            autoFocus
          />
          <div className="comment-actions">
            <button
              className="comment-btn cancel"
              onClick={() => {
                setShowCommentBox(false);
                setCommentText("");
                setSelectedText(null);
              }}
            >
              Cancel
            </button>
            <button
              className="comment-btn save"
              onClick={() => handleAddComment()}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}
