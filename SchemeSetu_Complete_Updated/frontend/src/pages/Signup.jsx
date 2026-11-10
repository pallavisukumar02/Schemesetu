import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", phone_number:"", password:"", confirm:"", whatsapp_opt_in:true });
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  async function submit(e){
    e.preventDefault(); setError("");
    if(form.password!==form.confirm) return setError("Passwords do not match");
    setBusy(true);
    try { await signup(form); navigate("/onboarding", {replace:true}); }
    catch(err){setError(err.message)} finally{setBusy(false)}
  }
  return <div className="ss-account-page"><div className="ss-account-inner">
    <div className="panel">
      <p className="eyebrow">CREATE YOUR SCHEMESETU ACCOUNT</p>
      <h1 className="font-display text-3xl mb-2">One account. One application hub.</h1>
      <p className="text-sm text-ink/60 mb-6">Your password is stored as a secure one-way hash. SchemeSetu keeps your application tracker on the server so you can return later.</p>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name"><input className="account-input" required value={form.name} onChange={e=>set("name",e.target.value)} autoComplete="name" /></Field>
        <Field label="Email"><input className="account-input" type="email" required value={form.email} onChange={e=>set("email",e.target.value)} autoComplete="email" /></Field>
        <Field label="WhatsApp / mobile number"><input className="account-input" type="tel" placeholder="+919876543210" required value={form.phone_number} onChange={e=>set("phone_number",e.target.value)} autoComplete="tel" /></Field>
        <Field label="Password"><input className="account-input" type="password" minLength="8" required value={form.password} onChange={e=>set("password",e.target.value)} autoComplete="new-password" /></Field>
        <Field label="Confirm password"><input className="account-input" type="password" minLength="8" required value={form.confirm} onChange={e=>set("confirm",e.target.value)} autoComplete="new-password" /></Field>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.whatsapp_opt_in} onChange={e=>set("whatsapp_opt_in",e.target.checked)} /> I agree to receive SchemeSetu application-status notifications on WhatsApp when messaging is configured.</label>
        {error && <p className="text-sm text-rust">{error}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? "Creating account…" : "Create account"}</button>
      </form>
      <p className="text-sm text-ink/60 mt-6 text-center">Already have an account? <Link className="underline" to="/login">Sign in</Link></p>
    </div>
  </div></div>;
}
function Field({label,children}) { return <label className="field"><span>{label}</span>{children}</label>; }
