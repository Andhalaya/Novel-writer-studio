// src/components/dashboard/ProjectCard.jsx
import React from "react";
import { ChevronRight } from "lucide-react";

function ProjectCard({ project, openProject }) {
  const {
    title,
    status,
    goalWordCount,
    currentWordCount,
    lastEdited,
    chapters,
  } = project;

  const progress =
    goalWordCount > 0
      ? ((currentWordCount / goalWordCount) * 100).toFixed(1)
      : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            status === "drafting"
              ? "bg-blue-100 text-blue-700"
              : status === "planning"
              ? "bg-yellow-100 text-yellow-700"
              : status === "editing"
              ? "bg-purple-100 text-purple-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {status}
        </span>
      </div>

      {/* Word count */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-gray-800">{progress}%</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between text-sm text-gray-600">
          <span>{currentWordCount?.toLocaleString() || 0} words</span>
          <span>{goalWordCount?.toLocaleString() || 0} goal</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {chapters ? `${chapters} chapters` : ""} •{" "}
          {lastEdited?.toDate
            ? lastEdited.toDate().toISOString().slice(0, 10)
            : ""}
        </div>

        <button
          onClick={() => openProject(project)}
          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Open
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default ProjectCard;
