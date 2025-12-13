import React from "react";
import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";

import "./App.css";

import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { FirestoreProvider } from "./context/FirestoreContext";
import { ProjectProvider } from "./context/ProjectContext";

import PrivateRoute from "./components/auth/PrivateRoute";

import Login from "./pages/login/Login";
import DashboardView from "./pages/dashboard/DashboardView";
import ChaptersView from "./pages/project/chapters/ChaptersView";
import CodexView from "./pages/project/codex/CodexView";
import ManuscriptView from "./pages/project/manuscript/ManuscriptView";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <FirestoreProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes with AppLayout and ProjectProvider */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <ProjectProvider>
                    <AppLayout>
                      <DashboardView />
                    </AppLayout>
                  </ProjectProvider>
                </PrivateRoute>
              }
            />

            <Route
              path="/dashboard/:projectId"
              element={
                <PrivateRoute>
                  <ProjectProvider>
                    <AppLayout>
                      <DashboardView />
                    </AppLayout>
                  </ProjectProvider>
                </PrivateRoute>
              }
            />

            {/* Project-specific routes */}
            <Route
              path="/project/:projectId/chapters"
              element={
                <PrivateRoute>
                  <ProjectProvider>
                    <AppLayout>
                      <ChaptersView />
                    </AppLayout>
                  </ProjectProvider>
                </PrivateRoute>
              }
            />

            <Route
              path="/project/:projectId/codex"
              element={
                <PrivateRoute>
                  <ProjectProvider>
                    <AppLayout>
                      <CodexView />
                    </AppLayout>
                  </ProjectProvider>
                </PrivateRoute>
              }
            />

            <Route
              path="/project/:projectId/manuscript"
              element={
                <PrivateRoute>
                  <ProjectProvider>
                    <AppLayout>
                      <ManuscriptView />
                    </AppLayout>
                  </ProjectProvider>
                </PrivateRoute>
              }
            />
          </Routes>
        </FirestoreProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;