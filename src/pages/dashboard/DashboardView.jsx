import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Users, 
  FileText, 
  TrendingUp,
  Calendar,
  Plus,
  ChevronRight,
  Clock,
  Target,
  X
} from "lucide-react";
import { useFirestore } from "../../context/FirestoreContext";
import { useProject } from "../../context/ProjectContext";
import "./DashboardView.css";
import React from "react";

function DashboardView() {
  const navigate = useNavigate();
  const { getChapters, createProject } = useFirestore();
  const { currentProject, projects, selectProject, refreshProjects, loading } = useProject();
  const selectedProject = currentProject;

  const [chapters, setChapters] = useState([]);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // Modal form state
  const [modalTitle, setModalTitle] = useState("");
  const [modalGoalWordCount, setModalGoalWordCount] = useState("");
  const [modalStatus, setModalStatus] = useState("Planning");
  const [modalError, setModalError] = useState("");

  // Load chapters when currentProject changes
  useEffect(() => {
    if (currentProject) {
      getChapters(currentProject.id).then(setChapters);
    } else {
      setChapters([]);
    }
  }, [currentProject, getChapters]);

  const openProject = (id) => {
    navigate(`/project/${id}/chapters`);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setModalError("");

    if (!modalTitle.trim()) {
      setModalError("Title is required.");
      return;
    }

    const projectData = {
      title: modalTitle,
      status: modalStatus,
      goalWordCount: Number(modalGoalWordCount) || 0,
      currentWordCount: 0,
      lastEdited: new Date().toISOString().slice(0, 10),
    };

    try {
      const docRef = await createProject(projectData);
      
      // Refresh projects list
      await refreshProjects();
      
      // Close modal and reset form
      setShowNewProjectModal(false);
      setModalTitle("");
      setModalGoalWordCount("");
      setModalStatus("Planning");
      setModalError("");
      
      // Navigate to the new project dashboard
      selectProject(docRef.id);
    } catch (err) {
      console.error(err);
      setModalError("Could not create project.");
    }
  };

  const closeModal = () => {
    setShowNewProjectModal(false);
    setModalTitle("");
    setModalGoalWordCount("");
    setModalStatus("Planning");
    setModalError("");
  };

  // PROJECT DASHBOARD VIEW - Show when a project is selected
  if (currentProject) {
    const completedChapters = chapters.filter(c => c.status === "Complete" || c.status === "Completed").length;
    const inProgressChapters = chapters.filter(c => c.status === "In Progress" || c.status === "Drafting").length;
    const avgWordsPerChapter = chapters.length > 0 
      ? Math.round(currentProject.currentWordCount / chapters.length) 
      : 0;

    return (
      <div className="dashboard-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Project Dashboard</h1>
            <p className="page-subtitle">Overview & Analytics</p>
          </div>
          <div className="header-actions">
            <span className={`project-status status-${currentProject.status?.toLowerCase().replace(" ", "")}`}>
              {currentProject.status || "Planning"}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <FileText className="stat-icon" size={20} />
              <span className="stat-label">Word Count</span>
            </div>
            <div className="stat-value">
              {currentProject.currentWordCount?.toLocaleString() || 0}
            </div>
            <div className="stat-subtitle">
              of {currentProject.goalWordCount?.toLocaleString() || 0} goal
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${currentProject.goalWordCount > 0 
                    ? Math.min((currentProject.currentWordCount / currentProject.goalWordCount) * 100, 100) 
                    : 0}%` 
                }}
              />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <BookOpen className="stat-icon" size={20} />
              <span className="stat-label">Chapters</span>
            </div>
            <div className="stat-value">
              {chapters.length}
              <span className="stat-value-sub"> total</span>
            </div>
            <div className="stat-subtitle">
              {completedChapters} completed • {inProgressChapters} in progress
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <TrendingUp className="stat-icon" size={20} />
              <span className="stat-label">Progress</span>
            </div>
            <div className="stat-value">
              {selectedProject.goalWordCount > 0 
                ? Math.round((selectedProject.currentWordCount / selectedProject.goalWordCount) * 100) 
                : 0}%
            </div>
            <div className="stat-subtitle">Overall completion</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <Target className="stat-icon" size={20} />
              <span className="stat-label">Avg Per Chapter</span>
            </div>
            <div className="stat-value stat-value-small">
              {avgWordsPerChapter.toLocaleString()}
            </div>
            <div className="stat-subtitle">words per chapter</div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="dashboard-columns">
          {/* Recent Activity */}
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">
                <Clock size={18} />
                Recent Activity
              </h2>
            </div>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon activity-edit">📝</div>
                <div className="activity-content">
                  <div className="activity-title">Chapter updated</div>
                  <div className="activity-meta">
                    {currentProject.lastEdited || "Recently"}
                  </div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon activity-create">✨</div>
                <div className="activity-content">
                  <div className="activity-title">Project created</div>
                  <div className="activity-meta">
                    {currentProject.createdAt?.toDate 
                      ? currentProject.createdAt.toDate().toLocaleDateString() 
                      : "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">Quick Actions</h2>
            </div>
            <div className="action-buttons">
              <button 
                className="action-btn"
                onClick={() => navigate(`/project/${currentProject.id}/chapters`)}
              >
                <BookOpen size={20} />
                <div>
                  <div className="action-btn-title">View Chapters</div>
                  <div className="action-btn-subtitle">Manage story structure</div>
                </div>
                <ChevronRight size={16} />
              </button>

              <button 
                className="action-btn"
                onClick={() => navigate(`/project/${currentProject.id}/codex`)}
              >
                <Users size={20} />
                <div>
                  <div className="action-btn-title">Open Codex</div>
                  <div className="action-btn-subtitle">Characters & locations</div>
                </div>
                <ChevronRight size={16} />
              </button>

              <button 
                className="action-btn"
                onClick={() => navigate(`/project/${currentProject.id}/manuscript`)}
              >
                <FileText size={20} />
                <div>
                  <div className="action-btn-title">Edit Manuscript</div>
                  <div className="action-btn-subtitle">Write your story</div>
                </div>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Chapters Overview */}
        <div className="content-section">
          <div className="section-header">
            <h2 className="section-title">Chapters Overview</h2>
            <button 
              className="btn-primary-sm"
              onClick={() => navigate(`/project/${currentProject.id}/chapters`)}
            >
              View All
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="chapters-list">
            {chapters.length === 0 ? (
              <div className="empty-state">
                <BookOpen size={48} className="empty-icon" />
                <p>No chapters yet</p>
                <button 
                  className="btn-secondary"
                  onClick={() => navigate(`/project/${currentProject.id}/chapters`)}
                >
                  Create First Chapter
                </button>
              </div>
            ) : (
              chapters.slice(0, 5).map((chapter, index) => (
                <div 
                  key={chapter.id} 
                  className="chapter-item"
                  onClick={() => navigate(`/project/${currentProject.id}/chapters`)}
                >
                  <div className="chapter-number">{index + 1}</div>
                  <div className="chapter-info">
                    <div className="chapter-name">{chapter.title}</div>
                    <div className="chapter-meta">
                      {chapter.wordCount || 0} words
                    </div>
                  </div>
                  <span className={`badge badge-${chapter.status?.toLowerCase().replace(" ", "") || "draft"}`}>
                    {chapter.status || "Draft"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // PROJECTS LIST VIEW - Show when no project selected
  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Projects</h1>
          <p className="page-subtitle">Manage and organize your writing projects</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowNewProjectModal(true)}
        >
          <Plus size={20} />
          New Project
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state-large">
          <BookOpen size={64} className="empty-icon" />
          <h2>No projects yet</h2>
          <p>Create your first writing project to get started</p>
          <button 
            className="btn-primary"
            onClick={() => setShowNewProjectModal(true)}
          >
            <Plus size={20} />
            Create Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className="project-card"
              onClick={() => selectProject(project.id)}
            >
              <div className="project-card-header">
                <h3 className="project-title">{project.title}</h3>
                <span className={`project-status status-${project.status?.toLowerCase().replace(" ", "")}`}>
                  {project.status || "Planning"}
                </span>
              </div>

              <div className="project-stats">
                <div className="project-stat">
                  <FileText size={16} />
                  <span>{project.currentWordCount?.toLocaleString() || 0} words</span>
                </div>
                <div className="project-stat">
                  <BookOpen size={16} />
                  <span>{project.chapters || 0} chapters</span>
                </div>
              </div>

              <div className="project-progress-section">
                <div className="progress-info">
                  <span className="progress-label">Progress</span>
                  <span className="progress-percentage">
                    {project.goalWordCount > 0 
                      ? Math.round((project.currentWordCount / project.goalWordCount) * 100) 
                      : 0}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${project.goalWordCount > 0 
                        ? Math.min((project.currentWordCount / project.goalWordCount) * 100, 100) 
                        : 0}%` 
                    }}
                  />
                </div>
                <div className="progress-detail">
                  <span>Goal: {project.goalWordCount?.toLocaleString() || 0} words</span>
                </div>
              </div>

              <div className="project-footer">
                <span className="project-date">
                  <Calendar size={14} />
                  {project.lastEdited || "Not edited yet"}
                </span>
                <ChevronRight size={16} className="project-arrow" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">New Project</h2>
              <button className="modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form className="modal-form" onSubmit={handleCreateProject}>
              <div className="form-field">
                <label className="form-label">Project Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="Enter your novel title..."
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label className="form-label">Goal Word Count</label>
                <input
                  type="number"
                  className="form-input"
                  value={modalGoalWordCount}
                  onChange={(e) => setModalGoalWordCount(e.target.value)}
                  placeholder="80000"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Drafting">Drafting</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {modalError && <div className="form-error">{modalError}</div>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardView;