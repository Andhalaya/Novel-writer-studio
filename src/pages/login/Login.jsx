import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { BookOpen } from 'lucide-react';
import "./Login.css";

function AuthScreen() {
  const { login, register } = useAuth();
  const navigate = useNavigate(); 
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (tab === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.message || "Auth error");
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <BookOpen size={40} color="#6366f1" />
            <h1>Novel Writer's Studio</h1>
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => setTab('login')}
            >
              Login
            </button>
            <button
              className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
              onClick={() => setTab('signup')}
            >
              Sign Up
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px' }}>
                {error}
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Please wait...' : tab === 'login' ? 'Login' : 'Sign Up'}
            </button>
          </form>

          <p className="auth-hint">
            {tab === 'login'
              ? 'Enter your email and password to continue'
              : 'Create a new account to start writing'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;