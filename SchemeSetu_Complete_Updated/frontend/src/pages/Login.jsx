import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try { const user = await login(email, password); const profileReady = Boolean(user?.income_bracket && user?.business_type && user?.state && user?.district); navigate(location.state?.from || (profileReady ? "/dashboard" : "/onboarding"), { replace: true }); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return <div className="ss-account-page"><div className="ss-account-inner">
    <div className="panel">
      <p className="eyebrow">RETURNING ENTREPRENEUR</p>
      <h1 className="font-display text-3xl mb-2">Welcome back</h1>
      <p className="text-sm text-ink/60 mb-7">Your profile, saved applications and tracker stay connected to your account.</p>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email"><input className="account-input" type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" /></Field>
        <Field label="Password"><input className="account-input" type="password" required value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" /></Field>
        {error && <p className="text-sm text-rust">{error}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      <p className="text-sm text-ink/60 mt-6 text-center">New here? <Link className="underline" to="/signup">Create an account</Link></p>
    </div>
  </div></div>;
}
function Field({label,children}) { return <label className="field"><span>{label}</span>{children}</label>; }
