import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import StatusMessage from "../components/common/StatusMessage";
import { useAuth } from "../context/AuthContext";
import services from "../services";
import "./LoginPage.css";

function LoginPage() {
  const { isAuthenticated, login, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    try {
      await login({ email: email.trim(), password });
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Login failed.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>PCB Inventory Automation</h1>
        <p className="login-subtitle">Admin role required for write operations.</p>

        <StatusMessage type="error" message={error} />

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@local.test"
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
            />
          </div>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {services.mode === "local" ? (
          <p className="login-subtitle">
            Local mode credentials: admin@local.test / Admin@123 or viewer@local.test / Viewer@123.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default LoginPage;

