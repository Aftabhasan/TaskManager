import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, useAuth } from "../App";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await api("/auth/login", { method: "POST", body: JSON.stringify(form) });
      login(data.user, data.token);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Sign in</h1>
        <p className="auth-subtitle">Welcome back to TaskFlow</p>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label>Email</label>
            <input type="email" required placeholder="you@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="password-input">
              <input type={showPw ? "text" : "password"} required placeholder="Enter your password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="button" className="password-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>{showPw ? "🙈" : "👁"}</button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-block">Sign in</button>
        </form>
        <p className="auth-link">Don't have an account? <Link to="/signup">Create one</Link></p>
        <p className="auth-link" style={{ marginTop: 2 }}><Link to="/forgot-password">Forgot password?</Link></p>
      </div>
    </div>
  );
}
