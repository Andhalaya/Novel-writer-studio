import React from "react";
import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import "./App.css";

import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { FirestoreProvider } from "./context/FirestoreContext";

import PrivateRoute from "./components/auth/PrivateRoute";

import Header from "./components/layout/Header/Header";
import SideBar from "./components/layout/sideBar/SideBar";

import Login from "./pages/login/Login";
import Register from "./pages/login/Register";

import DashboardView from "./pages/dashboard/DashboardView";

import ChaptersView from "./pages/project/chapters/ChaptersView";
import CodexView from "./pages/project/codex/CodexView";
import ManuscriptView from "./pages/project/manuscript/ManuscriptView";

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);


  return (
    <AuthProvider>
      <ThemeProvider>
        <FirestoreProvider>
          <div className="app-root">
            <SideBar collapsed={sidebarCollapsed} />
            <div className="app-layout">
            <Header 
  sidebarCollapsed={sidebarCollapsed} 
  setSidebarCollapsed={setSidebarCollapsed} 
/>
            
              <main className="app-main">
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Protected routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <PrivateRoute>
                        <DashboardView />
                      </PrivateRoute>
                    }
                  />

                  {/* Project-specific routes */}
                  <Route
                    path="/project/:projectId/chapters"
                    element={
                      <PrivateRoute>
                        <ChaptersView />
                      </PrivateRoute>
                    }
                  />

                  <Route
                    path="/project/:projectId/codex"
                    element={
                      <PrivateRoute>
                        <CodexView />
                      </PrivateRoute>
                    }
                  />

                  <Route
                    path="/project/:projectId/manuscript"
                    element={
                      <PrivateRoute>
                        <ManuscriptView />
                      </PrivateRoute>
                    }
                  />

                  {/* Optional route for creating new project */}
                  {/* Could point to a modal/page: <NewProjectPage /> */}
                  {/* <Route
                    path="/project/new"
                    element={
                      <PrivateRoute>
                        <NewProjectPage />
                      </PrivateRoute>
                    }
                  /> */}
                </Routes>
              </main>
            </div>
          </div>

        </FirestoreProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
