import { useEffect, useMemo, useState } from "react";

const emptyMetrics = { users: 0, applications: 0, approved: 0, underReview: 0, notifications: 0 };

export default function Host() {
  const [host, setHost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [users, setUsers] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [deployment, setDeployment] = useState({ configured: false, environment: "development", publicOrigin: null });

  async function checkSession() {
    setLoading(true);
    const r = await fetch("/api/host/me", { credentials: "include" });
    if (r.ok) { const d = await r.json(); setHost(d.host); await loadDashboard(); }
    else setHost(null);
    const s = await fetch("/api/host/status").then(x => x.json()).catch(() => ({}));
    setDeployment(s); setLoading(false);
  }
  async function loadDashboard(q = "") {
    const [o, u] = await Promise.all([
      fetch("/api/host/overview", { credentials: "include" }).then(r => r.ok ? r.json() : null),
      fetch(`/api/host/users?search=${encodeURIComponent(q)}`, { credentials: "include" }).then(r => r.ok ? r.json() : null)
    ]);
    if (o) { setMetrics(o.metrics || emptyMetrics); setRecentUsers(o.recentUsers || []); }
    if (u) setUsers(u.users || []);
  }
  useEffect(() => { checkSession(); }, []);

  async function login(e) {
    e.preventDefault(); setError("");
    const r = await fetch("/api/host/login", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setError(d.error || "Host login failed");
    setHost(d.host); setPassword(""); await loadDashboard();
  }
  async function logout() { await fetch("/api/host/logout", { method: "POST", credentials: "include" }); setHost(null); setSelected(null); }
  async function openUser(id) {
    const r = await fetch(`/api/host/users/${id}`, { credentials: "include" });
    const d = await r.json().catch(() => ({})); if (r.ok) setSelected(d); else setError(d.error || "Could not load user");
  }

  const publicUrl = deployment.publicOrigin || (typeof window !== "undefined" ? window.location.origin : "");
  const filteredRecent = useMemo(() => recentUsers, [recentUsers]);

  if (loading) return <div className="host-page"><div className="host-loading">Loading host console…</div></div>;
  if (!host) return <div className="host-page"><div className="host-login-card"><div className="host-brand"><span className="host-mark">S</span><div><b>SchemeSetu</b><span>Private host console</span></div></div><h1>Control center</h1><p>Sign in with the server-side host credentials. This area is separate from normal user accounts.</p><form onSubmit={login}><label>Email<input className="host-input" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" /></label><label>Password<input className="host-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" /></label>{error && <div className="host-error">{error}</div>}<button className="host-primary">Enter host console</button></form><div className="host-security-note">Host credentials stay on the backend environment. Never put them in frontend code.</div></div></div>;

  return <div className="host-page"><div className="host-shell">
    <header className="host-header"><div className="host-brand"><span className="host-mark">S</span><div><b>SchemeSetu</b><span>Host control center</span></div></div><div className="host-head-actions"><span className="host-live"><i/> {deployment.environment}</span><span className="host-email">{host.email}</span><button className="host-ghost" onClick={logout}>Sign out</button></div></header>

    <section className="host-hero"><div><span className="host-eyebrow">PRIVATE OPERATIONS</span><h1>User, application & deployment overview</h1><p>Monitor the accounts created in your SchemeSetu database, review application activity, and verify whether the deployed environment is configured for public access.</p></div><div className="host-url-card"><span>PUBLIC ORIGIN</span><strong>{publicUrl || "Not configured"}</strong><small>{deployment.publicOrigin ? "Configured by server environment" : "Set PUBLIC_ORIGIN on deployment"}</small></div></section>

    <section className="host-metrics"><Metric label="Registered users" value={metrics.users} /><Metric label="Tracked applications" value={metrics.applications} /><Metric label="Under review" value={metrics.underReview} /><Metric label="Approved status" value={metrics.approved} /><Metric label="Notifications" value={metrics.notifications} /></section>

    <section className="host-grid"><div className="host-panel host-wide"><div className="host-panel-head"><div><span className="host-eyebrow">USER DIRECTORY</span><h2>Registered accounts</h2></div><div className="host-search"><span>⌕</span><input placeholder="Search name, email or phone" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&loadDashboard(search)} /><button onClick={()=>loadDashboard(search)}>Search</button></div></div><div className="host-table-wrap"><table className="host-table"><thead><tr><th>ID</th><th>User</th><th>Phone</th><th>Location</th><th>Business</th><th>Language</th><th>Joined</th><th/></tr></thead><tbody>{users.map(u=><tr key={u.id}><td><b>#{u.id}</b></td><td><strong>{u.name}</strong><small>{u.email}</small></td><td>{u.phone_number}</td><td>{[u.district,u.state].filter(Boolean).join(", ")||"—"}</td><td>{u.business_type||"—"}</td><td>{u.preferred_language||"en"}</td><td>{formatDate(u.created_at)}</td><td><button className="host-view" onClick={()=>openUser(u.id)}>View</button></td></tr>)}{users.length===0&&<tr><td colSpan="8" className="host-empty">No users found.</td></tr>}</tbody></table></div></div>
      <div className="host-panel"><div className="host-panel-head"><div><span className="host-eyebrow">RECENT ACTIVITY</span><h2>Newest accounts</h2></div></div><div className="host-list">{filteredRecent.map(u=><button key={u.id} className="host-list-row" onClick={()=>openUser(u.id)}><span className="host-avatar">{(u.name||"U").slice(0,1).toUpperCase()}</span><span><b>{u.name}</b><small>{u.email}</small></span><em>#{u.id}</em></button>)}</div></div>
      <div className="host-panel"><div className="host-panel-head"><div><span className="host-eyebrow">DEPLOYMENT</span><h2>Public access</h2></div></div><div className="deploy-check"><Check ok={deployment.configured} title="Host credentials configured" detail="HOST_EMAIL + HOST_PASSWORD"/><Check ok={deployment.environment === "production"} title="Production mode" detail={deployment.environment}/><Check ok={Boolean(deployment.publicOrigin)} title="Public origin configured" detail={deployment.publicOrigin || "Missing PUBLIC_ORIGIN"}/><Check ok={true} title="Private host route" detail="/host is protected"/></div><div className="host-note">A public URL is normal for the user-facing app. The host console remains protected by server-side credentials and an HttpOnly session cookie.</div></div></section>
  </div>{selected && <UserDrawer data={selected} onClose={()=>setSelected(null)} />}</div>;
}
function Metric({label,value}){return <div className="host-metric"><span>{label}</span><strong>{value}</strong></div>}
function Check({ok,title,detail}){return <div className="deploy-check-row"><span className={ok?"ok":"warn"}>{ok?"✓":"!"}</span><div><b>{title}</b><small>{detail}</small></div></div>}
function formatDate(v){if(!v)return "—"; const d=new Date(v.replace(" ","T")+"Z"); return Number.isNaN(d.getTime())?v:d.toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"})}
function UserDrawer({data,onClose}){const u=data.user;return <div className="host-drawer-backdrop" onClick={onClose}><aside className="host-drawer" onClick={e=>e.stopPropagation()}><div className="host-drawer-head"><div><span className="host-eyebrow">USER #{u.id}</span><h2>{u.name}</h2><p>{u.email}</p></div><button onClick={onClose}>×</button></div><div className="host-profile-grid"><Info k="Phone" v={u.phone_number}/><Info k="Age" v={u.age}/><Info k="Category" v={u.category}/><Info k="Gender" v={u.gender}/><Info k="State" v={u.state}/><Info k="District" v={u.district}/><Info k="Income" v={u.income_bracket}/><Info k="Education" v={u.education_level}/><Info k="Business" v={u.business_type}/><Info k="Language" v={u.preferred_language}/><Info k="WhatsApp opt-in" v={u.whatsapp_opt_in?"Yes":"No"}/><Info k="Joined" v={formatDate(u.created_at)}/></div><div className="host-drawer-section"><span className="host-eyebrow">APPLICATIONS</span>{data.applications.length?data.applications.map(a=><div className="host-app-row" key={a.id}><div><b>{a.scheme_name||a.scheme_id}</b><small>{a.application_reference||"No reference ID"}</small></div><span>{a.status}</span></div>):<p className="host-muted">No tracked applications.</p>}</div><div className="host-drawer-section"><span className="host-eyebrow">NOTIFICATIONS</span><p className="host-muted">{data.notifications.length} notification records</p></div></aside></div>}
function Info({k,v}){return <div><span>{k}</span><b>{v||"—"}</b></div>}
