import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (mode === "login") {
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
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">
          {mode === "login" ? "Login" : "Create Account"}
        </h2>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-field">
            <label className="field-label">
              Email
              <input
                type="email"
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="form-field">
            <label className="field-label">
              Password
              <input
                type="password"
                className="field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="primary-btn">
            {mode === "login" ? "Login" : "Register"}
          </button>

          <button
            type="button"
            onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
            className="secondary-btn"
          >
            {mode === "login"
              ? "Need an account? Register"
              : "Already have an account? Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;