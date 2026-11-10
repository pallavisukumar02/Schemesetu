import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Stepper from "../components/Stepper.jsx";
import { getDocuments, getJourney, labelForScore, readinessFor, sourceLabel } from "../utils/schemeTools.js";

const STATUS_OPTIONS = ["matched", "applied", "under_review", "approved", "rejected"];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState(null);
  const [allSchemes, setAllSchemes] = useState([]);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("all");
  const [applications, setApplications] = useState({});
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (!user) { setMatches([]); return; }
    Promise.all([
      fetch("/api/schemes/match", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(user) }).then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "Could not calculate matches"); return d.matches || []; }),
      fetch("/api/schemes").then(r => r.json()),
      fetch("/api/applications", { credentials: "include" }).then(async r => r.ok ? (await r.json()).applications || [] : [])
    ]).then(([m, s, apps]) => { setMatches(m); setAllSchemes(s || []); setApplications(Object.fromEntries(apps.map(a => [a.scheme_id, a]))); }).catch(e => setError(e.message));
  }, [user]);

  async function saveStatus(scheme, status) {
    const m = matches?.find(x => x.schemeId === scheme.id);
    const existing = applications[scheme.id];
    const url = existing ? `/api/applications/${existing.id}` : "/api/applications";
    const method = existing ? "PATCH" : "POST";
    const body = existing ? { status, preferred_channel: "whatsapp" } : { scheme_id: scheme.id, status, match_score: m?.score || null, match_reasons: m?.reasons || [], preferred_channel: "whatsapp" };
    const r = await fetch(url, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setError(d.error || "Could not update tracker");
    setApplications(prev => ({ ...prev, [scheme.id]: d.application }));
  }

  function toggleCompare(id) {
    setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : prev.length >= 3 ? prev : [...prev, id]);
  }

  const filtered = useMemo(() => {
    if (!matches) return [];
    if (tab === "saved") return matches.filter(m => applications[m.schemeId]?.status && applications[m.schemeId].status !== "matched");
    if (tab === "high") return matches.filter(m => m.score >= 75);
    return matches;
  }, [matches, tab, applications]);

  const top = matches?.[0];
  const topReadiness = top ? readinessFor(top, user) : null;
  const journey = getJourney(user);
  const resourceCount = allSchemes.filter(s => s.resource_only).length;

  if (!user) return <div className="max-w-3xl mx-auto px-5 py-16"><h1 className="font-display text-3xl mb-3">Your Scheme Dashboard</h1><p className="text-ink/60 mb-6">Create your profile once and SchemeSetu will turn it into a personalized opportunity and application plan.</p><Link to="/onboarding" className="btn-primary">Create profile</Link></div>;
  if (error) return <div className="max-w-3xl mx-auto px-5 py-12"><p className="text-rust mb-3">{error}</p><button className="btn-secondary" onClick={() => window.location.reload()}>Try again</button></div>;
  if (!matches) return <p className="max-w-3xl mx-auto px-5 py-12 text-ink/50">Calculating your opportunities…</p>;

  return <div className="max-w-6xl mx-auto px-5 py-8 md:py-10">
    <section className="hero-panel mb-7">
      <div>
        <p className="eyebrow">PERSONALIZED ENTREPRENEUR HUB</p>
        <h1 className="font-display text-3xl md:text-4xl mb-2">Welcome, {user.name || "Entrepreneur"} 👋</h1>
        <p className="text-ink/65 max-w-2xl">SchemeSetu is your preparation layer: understand your matches, close eligibility gaps, get your documents ready, then move to the official portal.</p>
      </div>
      <Link to="/onboarding" className="btn-secondary">Edit profile</Link>
    </section>

    <section className="grid lg:grid-cols-4 gap-4 mb-7">
      <Metric title="Scheme matches" value={matches.length} sub="Rule-based fit" />
      <Metric title="Top match" value={`${Math.round(top?.score || 0)}%`} sub={top?.name || "—"} />
      <Metric title="Application readiness" value={`${topReadiness?.overall || 0}%`} sub="For top match" />
      <Metric title="Support resources" value={resourceCount} sub="Training, markets & IP" />
    </section>

    <section className="grid lg:grid-cols-[1.35fr_.65fr] gap-5 mb-8">
      <div className="panel">
        <div className="flex flex-wrap justify-between gap-3 mb-4"><div><p className="eyebrow">YOUR NEXT STEP</p><h2 className="font-display text-2xl">Application readiness</h2></div><span className="score-big">{topReadiness?.overall || 0}%</span></div>
        {top && <><p className="text-sm text-ink/65 mb-4">For <b>{top.name}</b>. This is a preparation indicator, not government approval.</p><Progress label="Eligibility fit" value={topReadiness.eligibility} /><Progress label="Profile completeness" value={topReadiness.profile} /><Progress label="Documents" value={topReadiness.documents} /><Progress label="Business details" value={topReadiness.business} /><div className="mt-5 flex flex-wrap gap-2"><Link to={`/prepare/${top.schemeId}`} className="btn-primary">Prepare my application</Link><Link to={`/schemes/${top.schemeId}`} className="btn-secondary">See why I matched</Link></div></>}
      </div>
      <div className="panel">
        <p className="eyebrow">BUSINESS JOURNEY</p><h2 className="font-display text-2xl mb-4">Where you are</h2>
        <div className="journey-list">{journey.map((step, i) => <div key={step} className="journey-step"><span>{i + 1}</span><b>{step}</b>{i === 0 && <small>Current profile</small>}</div>)}</div>
        <Link to="/toolkit" className="text-sm underline decoration-marigold decoration-2 mt-4 inline-block">Open Business Toolkit →</Link>
      </div>
    </section>

    <section className="mb-7">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4"><div><p className="eyebrow">MATCH EXPLORER</p><h2 className="font-display text-2xl">Opportunities built around your profile</h2></div>{selected.length > 1 && <button className="btn-primary" onClick={() => navigate(`/compare?ids=${selected.join(",")}`)}>Compare {selected.length}</button>}</div>
      <div className="tab-row mb-5"><button onClick={() => setTab("all")} className={tab === "all" ? "tab active" : "tab"}>All ({matches.length})</button><button onClick={() => setTab("high")} className={tab === "high" ? "tab active" : "tab"}>Strong fits ({matches.filter(m => m.score >= 75).length})</button><button onClick={() => setTab("saved")} className={tab === "saved" ? "tab active" : "tab"}>In my tracker ({Object.keys(applications).length})</button></div>
      <div className="grid md:grid-cols-2 gap-5">
        {filtered.map((m) => {
          const saved = applications[m.schemeId]; const status = saved?.status || "matched"; const badge = labelForScore(m.score); const ready = readinessFor(m, user);
          return <article key={m.schemeId} className="scheme-card">
            <div className="flex justify-between gap-3"><div><p className="text-xs text-ink/45 mb-1">{m.ministry}</p><h3 className="font-display text-xl leading-tight">{m.name}</h3></div><div className="text-right"><span className="score">{Math.round(m.score)}%</span><span className={badge.className}>{badge.label}</span></div></div>
            <p className="text-sm text-ink/65 mt-3">{m.plain_language_summary}</p>
            <div className="flex flex-wrap gap-2 mt-3">{(m.reasons || []).slice(0, 3).map((r, i) => <span key={i} className="chip">✓ {r}</span>)}</div>
            <div className="mt-4 rounded-xl bg-paper border border-ink/8 p-3"><div className="flex justify-between text-xs mb-1"><span>Application readiness</span><b>{ready.overall}%</b></div><div className="progress-track"><span style={{width: `${ready.overall}%`}} /></div></div>
            <div className="mt-4 flex flex-wrap gap-2"><Link to={`/schemes/${m.schemeId}`} className="btn-link">Why this match →</Link><Link to={`/prepare/${m.schemeId}`} className="btn-small">Prepare</Link><button onClick={() => toggleCompare(m.schemeId)} className={`btn-small ${selected.includes(m.schemeId) ? "selected" : ""}`}>{selected.includes(m.schemeId) ? "✓ Comparing" : "Compare"}</button></div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink/8 pt-3"><select value={status} onChange={e => saveStatus(m, e.target.value)} className="select-small">{STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select><a href={m.application_link} target="_blank" rel="noreferrer" className="text-xs underline decoration-marigold decoration-2">Official portal ↗</a></div><Stepper status={status} />
          </article>;
        })}
      </div>
    </section>

    <section className="grid md:grid-cols-3 gap-4 mb-8">
      <Quick title="My application tracker" body="See saved applications, reference IDs, status timelines and notifications." to="/tracker" icon="📦" /><Quick title="Compare schemes" body="See match, readiness, support type and preparation side by side." to="/compare" icon="⚖️" />
      <Quick title="Explore support" body="Funding, training, market access, IP and entrepreneurship resources." to="/opportunities" icon="🧭" />
      <Quick title="Privacy center" body="See what SchemeSetu stores locally and clear your profile when you want." to="/privacy" icon="🔐" />
    </section>

    <div className="text-xs text-ink/45 border-t border-ink/10 pt-5">SchemeSetu scores are preliminary, rule-based fit indicators. They do not guarantee eligibility, funding, approval or benefit. Always verify current requirements on the official source before submitting an application. Source links are shown so the final submission stays with the relevant authority.</div>
  </div>;
}

function Metric({ title, value, sub }) { return <div className="metric"><span>{title}</span><strong>{value}</strong><small title={sub}>{sub}</small></div>; }
function Progress({ label, value }) { return <div className="mb-3"><div className="flex justify-between text-xs mb-1"><span>{label}</span><b>{value}%</b></div><div className="progress-track"><span style={{width: `${value}%`}} /></div></div>; }
function Quick({ title, body, to, icon }) { return <Link to={to} className="panel hover:-translate-y-0.5 transition"><div className="text-2xl mb-2">{icon}</div><h3 className="font-display text-xl">{title}</h3><p className="text-sm text-ink/60 mt-1">{body}</p><span className="text-sm underline decoration-marigold decoration-2 mt-3 inline-block">Open →</span></Link>; }
