import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Start() {
  const { user, loading } = useAuth();
  if (loading) return <main className="ss-auth-page" />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <main className="ss-auth-page">
    <div className="ss-auth-glow" />
    <Link to="/" className="ss-brand ss-auth-brand"><span className="ss-brand-mark">S</span><span>SchemeSetu</span></Link>
    <section className="ss-auth-card">
      <span className="ss-eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
      <h1>Let's find the support<br/><em>that fits your journey.</em></h1>
      <p>Create your profile to discover schemes that may match your business, income range and goals. Already with us? Sign in to continue.</p>
      <div className="ss-auth-actions">
        <Link to="/signup" className="ss-primary">Create an account <span>→</span></Link>
        <Link to="/login" className="ss-secondary">I already have an account</Link>
      </div>
      <div className="ss-auth-foot"><span>01 · Create your account</span><span>02 · Tell us about your business</span><span>03 · Explore your matches</span></div>
    </section>
    <Link to="/" className="ss-auth-back">← Back to SchemeSetu</Link>
  </main>;
}
