import { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: 10 }}>✉️</div>
          <h1>Check your inbox</h1>
          <p className="auth-subtitle">We sent a reset link to {email}</p>
          <Link to="/login" className="btn btn-primary btn-block">Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Reset password</h1>
        <p className="auth-subtitle">We'll email you a reset link</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-block">Send reset link</button>
        </form>
        <p className="auth-link"><Link to="/login">Back to sign in</Link></p>
      </div>
    </div>
  );
}
