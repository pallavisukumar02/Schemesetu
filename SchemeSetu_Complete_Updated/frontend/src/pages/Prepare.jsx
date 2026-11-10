import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDocuments, readinessFor, sourceLabel } from "../utils/schemeTools.js";
import { useAuth } from "../context/AuthContext.jsx";

const KEY = "schemesetu_prepare";
export default function Prepare() {
  const { id } = useParams();
  const { user } = useAuth();
  const [scheme, setScheme] = useState(null);
  const [match, setMatch] = useState(null);
  const [checked, setChecked] = useState([]);
  const [project, setProject] = useState(() => { try { return JSON.parse(localStorage.getItem(`${KEY}_${id}`) || "{}"); } catch { return {}; } });
  const [note, setNote] = useState(() => localStorage.getItem(`schemesetu_note_${id}`) || "");
  const [tracked, setTracked] = useState(false);
  const [trackMessage, setTrackMessage] = useState("");

  useEffect(() => {
    Promise.all([fetch(`/api/schemes/${id}`).then(r => r.json()), user ? fetch("/api/schemes/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(user) }).then(r => r.json()) : Promise.resolve({ matches: [] })]).then(([s, m]) => { setScheme(s); setMatch((m.matches || []).find(x => x.schemeId === id) || { schemeId: id, score: 0, reasons: [] }); });
    try { setChecked(JSON.parse(localStorage.getItem(`schemesetu_docs_${id}_list`) || "[]")); } catch {}
  }, [id, user]);

  const docs = useMemo(() => getDocuments(id), [id]);
  const readiness = match && user ? readinessFor(match, user) : null;
  function toggleDoc(i) { const next = checked.includes(i) ? checked.filter(x => x !== i) : [...checked, i]; setChecked(next); localStorage.setItem(`schemesetu_docs_${id}_list`, JSON.stringify(next)); localStorage.setItem(`schemesetu_docs_${id}`, String(next.length)); }
  function updateProject(field, value) { const next = { ...project, [field]: value }; setProject(next); localStorage.setItem(`${KEY}_${id}`, JSON.stringify(next)); }
  function saveNote(value) { setNote(value); localStorage.setItem(`schemesetu_note_${id}`, value); }
  async function startTracking() {
    setTrackMessage("");
    const r = await fetch("/api/applications", { method:"POST", credentials:"include", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ scheme_id:id, status:"preparing", match_score:match?.score || null, match_reasons:match?.reasons || [], preferred_channel:"whatsapp" }) });
    const d = await r.json().catch(()=>({}));
    if(!r.ok) return setTrackMessage(d.error || "Could not start tracking");
    setTracked(true); setTrackMessage(d.notification?.status === "demo_pending" ? "Saved. Notifications are ready once a messaging provider is configured." : "Saved to your account tracker.");
  }
  if (!scheme) return <div className="max-w-5xl mx-auto px-5 py-12 text-ink/50">Loading preparation workspace…</div>;

  return <div className="max-w-5xl mx-auto px-5 py-8">
    <Link to="/dashboard" className="text-sm underline">← Back to dashboard</Link>
    <div className="hero-panel mt-4 mb-6"><div><p className="eyebrow">APPLICATION PREPARATION WORKSPACE</p><h1 className="font-display text-3xl">{scheme.name}</h1><p className="text-ink/60 mt-2">Turn your match into a practical checklist before you leave SchemeSetu.</p></div><div className="score-block"><span>Readiness</span><b>{readiness?.overall || 0}%</b></div></div>

    <div className="grid lg:grid-cols-[1.3fr_.7fr] gap-5">
      <div className="space-y-5">
        <section className="panel"><SectionTitle number="1" title="Why this scheme is in your shortlist"/><p className="text-sm text-ink/65 mb-3">Your match is a preliminary fit indicator, not an approval.</p><div className="flex flex-wrap gap-2">{(match?.reasons || []).map((r, i) => <span className="chip" key={i}>✓ {r}</span>)}{!(match?.reasons || []).length && <span className="chip">Review the official eligibility conditions</span>}</div>{match?.whyNot?.length > 0 && <div className="alert mt-4"><b>Eligibility gaps to verify</b><ul className="list-disc ml-5 mt-1">{match.whyNot.map((x,i)=><li key={i}>{x}</li>)}</ul></div>}</section>

        <section className="panel"><SectionTitle number="2" title="Document readiness"/><p className="text-sm text-ink/60 mb-4">This is a preparation checklist. The official portal may ask for additional or different documents.</p>{docs.map((doc, i) => <label key={doc} className="check-row"><input type="checkbox" checked={checked.includes(i)} onChange={() => toggleDoc(i)} /><span>{doc}</span><small>{checked.includes(i) ? "Prepared" : "To prepare"}</small></label>)}<div className="mt-4 text-xs text-ink/45">{checked.length}/{docs.length} checklist items marked prepared.</div></section>

        <section className="panel"><SectionTitle number="3" title="Build your application-ready business outline"/><div className="grid md:grid-cols-2 gap-4"><Field label="Business idea"><input value={project.idea || ""} onChange={e=>updateProject("idea",e.target.value)} placeholder="e.g. tailoring, food processing, digital service" /></Field><Field label="Target customer"><input value={project.customer || ""} onChange={e=>updateProject("customer",e.target.value)} placeholder="Who will buy?" /></Field><Field label="Expected investment"><input value={project.investment || ""} onChange={e=>updateProject("investment",e.target.value)} placeholder="Approximate amount" /></Field><Field label="Expected monthly sales"><input value={project.sales || ""} onChange={e=>updateProject("sales",e.target.value)} placeholder="Illustrative estimate" /></Field></div><Field label="How will the business create value?"><textarea value={project.value || ""} onChange={e=>updateProject("value",e.target.value)} placeholder="Products/services, customers, jobs, local impact…" /></Field><p className="text-[11px] text-ink/45 mt-2">Draft helper only. Review every number and statement before using it in an official application.</p></section>

        <section className="panel"><SectionTitle number="4" title="Your next action"/><div className="grid md:grid-cols-3 gap-3"><Action title="Finish documents" body={`${checked.length}/${docs.length} prepared`} done={checked.length === docs.length}/><Action title="Review business outline" body={project.idea ? "Started" : "Not started"} done={Boolean(project.idea)}/><Action title="Official submission" body="Only after verification" /></div><div className="mt-5 flex flex-wrap gap-2"><button onClick={startTracking} className="btn-secondary">{tracked ? "✓ Tracking this application" : "Track this application"}</button><a href={scheme.application_link} target="_blank" rel="noreferrer" className="btn-primary">Continue to official portal ↗</a><Link to={`/tracker`} className="btn-secondary">Open my tracker</Link><Link to={`/schemes/${id}`} className="btn-secondary">Review scheme details</Link></div><p className="text-xs text-ink/45 mt-3">{sourceLabel(scheme.application_link)} · SchemeSetu does not submit the application or guarantee approval.</p>{trackMessage && <p className="text-xs text-ink/60 mt-2">{trackMessage}</p>}</section>
      </div>
      <aside className="space-y-5"><section className="panel"><p className="eyebrow">YOUR PROFILE</p><h2 className="font-display text-xl mb-3">What SchemeSetu knows</h2><Mini label="Location" value={`${user?.district || "—"}, ${user?.state || "—"}`} /><Mini label="Business stage" value={user?.business_type || "—"} /><Mini label="Category" value={user?.category || "—"} /><Mini label="Income bracket" value={user?.income_bracket || "—"} /><Link to="/onboarding" className="text-sm underline decoration-marigold decoration-2 mt-4 inline-block">Update profile →</Link></section><section className="panel"><p className="eyebrow">PRIVATE NOTES</p><h2 className="font-display text-xl mb-2">My application notes</h2><textarea value={note} onChange={e=>saveNote(e.target.value)} placeholder="Bank questions, follow-up, reminders…" /><p className="text-[11px] text-ink/45 mt-2">Saved in this browser only.</p></section></aside>
    </div>
  </div>;
}
function SectionTitle({number,title}) { return <div className="flex items-center gap-3 mb-4"><span className="step-circle">{number}</span><h2 className="font-display text-xl">{title}</h2></div>; }
function Field({label,children}) { return <label className="field"><span>{label}</span>{children}</label>; }
function Mini({label,value}) { return <div className="mini"><span>{label}</span><b>{value}</b></div>; }
function Action({title,body,done}) { return <div className={`mini-card ${done ? "done" : ""}`}><b>{done ? "✓ " : "○ "}{title}</b><span>{body}</span></div>; }
