import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Manages resizable split panels (cards + editor).
 * Returns the current width percentage of the left panel and helpers to start/stop resizing.
 */
export function useResizablePanels({ min = 20, max = 60, initial = 30 } = {}) {
  const [width, setWidth] = useState(initial);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const percent = Math.min(max, Math.max(min, (relativeX / rect.width) * 100));
      setWidth(percent);
    };

    const handleMouseUp = () => setIsResizing(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, max, min]);

  return {
    width,
    isResizing,
    startResizing,
    containerRef,
  };
}
