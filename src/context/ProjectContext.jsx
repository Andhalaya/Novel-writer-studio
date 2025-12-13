import React, { createContext, useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFirestore } from "./FirestoreContext";

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { getProjects } = useFirestore();

  const [currentProject, setCurrentProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all projects on mount
  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await getProjects();
        setProjects(data);
        console.log("Projects loaded:", data);
      } catch (error) {
        console.error("Error loading projects:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [getProjects]);

  // Update current project when projectId changes
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const project = projects.find((p) => p.id === projectId);
      setCurrentProject(project || null);
    } else {
      setCurrentProject(null);
    }
  }, [projectId, projects]);

  // Function to select a project (navigates to dashboard with project)
  const selectProject = (projectId) => {
    if (!projectId) {
      navigate("/dashboard");
      return;
    }
    navigate(`/dashboard/${projectId}`);
  };

  // Function to refresh projects list
  const refreshProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error("Error refreshing projects:", error);
    }
  };

  const value = {
    currentProject,
    projects,
    loading,
    selectProject,
    refreshProjects,
    isProjectSelected: !!currentProject,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within ProjectProvider");
  }
  return context;
}