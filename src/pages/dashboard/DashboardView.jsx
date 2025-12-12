import React, { useEffect, useState } from "react";
import "./DashboardView.css";
import { useFirestore } from "../../context/FirestoreContext";
import { useNavigate } from "react-router-dom";
import NewProjectModal from "../../components/ui/NewProjectModal/NewProjectModal";

function DashboardView() {
  const { getProjects } = useFirestore();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);


  const navigate = useNavigate();

  useEffect(() => {
    getProjects().then((data) => {
      setProjects(data);
      setLoading(false);
    });
  }, []);

  const openProject = (projectId) => {
    navigate(`/project/${projectId}/chapters`);
  };

  return (
    <div className="dashboard-container">

      <div className="dashboard-header">
        <h1 className="dashboard-title">My Projects</h1>
        <button
          className="dashboard-new-btn"
          onClick={() => setShowModal(true)}
        >
          + New Project
        </button>
      </div>
      <NewProjectModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={(newId) => navigate(`/project/${newId}/chapters`)}
      />
      {loading && <p className="dashboard-loading">Loading projects...</p>}

      {!loading && projects.length === 0 && (
        <p className="dashboard-empty">No projects yet. Create one to begin.</p>
      )}

      <div className="projects-grid">
        {projects.map((project) => (
          <div
            key={project.id}
            className="project-card"
            onClick={() => openProject(project.id)}
          >
            <div className="project-card-header">
              <h2 className="project-title">{project.title}</h2>
              <span className={`project-status status-${project.status.replace(" ", "").toLowerCase()}`}>
                {project.status}
              </span>
            </div>

            <div className="project-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width:
                      project.goalWordCount > 0
                        ? `${(project.currentWordCount / project.goalWordCount) * 100}%`
                        : "0%",
                  }}
                ></div>
              </div>
              <div className="progress-info">
                <span>{project.currentWordCount} words</span>
                <span>{project.goalWordCount} goal</span>
              </div>
            </div>

            <div className="project-footer">
              <span className="project-meta">
                {project.lastEdited}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

export default DashboardView;
