import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const STATUS=["matched","preparing","applied","under_review","action_required","approved","rejected","disbursed"];

export default function Tracker(){
  const {user}=useAuth();
  const [apps,setApps]=useState([]); const [notifications,setNotifications]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [integration,setIntegration]=useState({}); const [syncing,setSyncing]=useState({});
  async function load(){
    if(!user)return; setLoading(true);
    const [r,n]=await Promise.all([fetch("/api/applications",{credentials:"include"}),fetch("/api/notifications",{credentials:"include"})]);
    const d=await r.json().catch(()=>({})); const nd=await n.json().catch(()=>({}));
    if(!r.ok){setError(d.error||"Could not load tracker");setLoading(false);return}
    const list=d.applications||[]; setApps(list); setNotifications(nd.notifications||[]);
    const pairs=await Promise.all(list.map(async a=>{const x=await fetch(`/api/integrations/application/${a.id}`,{credentials:"include"}).then(r=>r.json()).catch(()=>({}));return [a.id,x]}));
    setIntegration(Object.fromEntries(pairs)); setLoading(false);
  }
  useEffect(()=>{load()},[user]);
  async function update(app, patch){
    const r=await fetch(`/api/applications/${app.id}`,{method:"PATCH",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(patch)});
    const d=await r.json().catch(()=>({})); if(!r.ok)return setError(d.error||"Could not update application");
    setApps(a=>a.map(x=>x.id===app.id?d.application:x));
  }
  async function sync(app){
    setError(""); setSyncing(x=>({...x,[app.id]:true}));
    const r=await fetch(`/api/integrations/sync/${app.id}`,{method:"POST",credentials:"include"}); const d=await r.json().catch(()=>({}));
    if(!r.ok){setError(d.error||d.detail||"Official status sync is not available"); setSyncing(x=>({...x,[app.id]:false})); return}
    setApps(a=>a.map(x=>x.id===app.id?d.application:x));
    const x=await fetch(`/api/integrations/application/${app.id}`,{credentials:"include"}).then(r=>r.json()).catch(()=>({})); setIntegration(i=>({...i,[app.id]:x})); setSyncing(y=>({...y,[app.id]:false}));
  }
  if(!user)return <div className="max-w-3xl mx-auto px-5 py-12"><h1 className="font-display text-3xl">Application tracker</h1><p className="text-ink/60 mt-2">Sign in to see your saved applications.</p><Link to="/login" className="btn-primary mt-5">Sign in</Link></div>;
  return <div className="max-w-6xl mx-auto px-5 py-10">
    <div className="hero-panel mb-7"><div><p className="eyebrow">MY APPLICATIONS</p><h1 className="font-display text-3xl">Your application journey</h1><p className="text-ink/60 mt-2">Track your application timeline. Manual updates are clearly labelled; automatic updates appear only from an authorized provider.</p></div><div className="flex gap-2"><Link to="/integrations" className="btn-secondary">Integration details</Link><Link to="/dashboard" className="btn-secondary">Find more schemes</Link></div></div>
    {error&&<div className="alert mb-4">{error}</div>}
    {!loading && notifications.length>0 && <section className="panel mb-5"><div className="flex items-center justify-between"><div><p className="eyebrow">NOTIFICATIONS</p><h2 className="font-display text-xl">Recent SchemeSetu updates</h2></div><span className="chip">{notifications.length} saved</span></div><div className="mt-3 space-y-2">{notifications.slice(0,5).map(n=><div key={n.id} className="border-l-2 border-marigold pl-3 text-sm"><b>{n.scheme_name||"Application"}</b><span className="text-ink/45 ml-2">{n.channel} · {n.status}</span><p className="text-xs text-ink/60">{n.message}</p></div>)}</div></section>}
    {loading?<p className="text-ink/50">Loading your tracker…</p>:apps.length===0?<div className="panel"><h2 className="font-display text-xl">Nothing tracked yet</h2><p className="text-sm text-ink/60 mt-2">Choose a scheme, prepare it, then set it to “applied” when you submit on the official portal.</p><Link to="/dashboard" className="btn-primary mt-5">Explore matches</Link></div>:<div className="space-y-5">{apps.map(app=>{
      const x=integration[app.id]||{}; const level3=x.level3||{};
      return <article key={app.id} className="panel"><div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs text-ink/45">{app.ministry}</p><h2 className="font-display text-2xl">{app.scheme_name}</h2><p className="text-xs text-ink/50 mt-1">Reference: {app.application_reference||"Not added yet"}</p></div><span className={app.status==="rejected"?"badge-red":app.status==="approved"?"badge-green":"badge-gold"}>{app.status.replaceAll("_"," ")}</span></div>
      <div className="grid md:grid-cols-3 gap-3 mt-5"><div className="mini-card"><b>Level 1 · Official portal</b><span><a className="underline" href={x.level1?.applicationUrl||app.application_link} target="_blank" rel="noreferrer">Open official application ↗</a></span></div><div className="mini-card"><b>Level 2 · Portal check</b><span>{x.level2?.reachable===true?"Official portal reachable":"Not checked yet"}{x.level2?.httpStatus?` · HTTP ${x.level2.httpStatus}`:""}</span></div><div className="mini-card"><b>Level 3 · Live status</b><span>{level3.configured?`Provider connected · ${level3.officialStatus||"Waiting for first update"}`:"Not connected by scheme authority"}</span></div></div>
      <div className="tracker-line mt-5">{STATUS.map((s,i)=><div key={s} className={`tracker-step ${STATUS.indexOf(app.status)>=i?"done":""}`}><span>{STATUS.indexOf(app.status)>=i?"✓":i+1}</span><small>{s.replaceAll("_"," ")}</small></div>)}</div>
      {level3.configured && <div className="mt-4 flex flex-wrap items-center gap-3"><button className="btn-small" disabled={syncing[app.id]} onClick={()=>sync(app)}>{syncing[app.id]?"Syncing…":"Sync official status"}</button><span className="text-xs text-ink/50">Last sync: {app.last_sync_at?new Date(app.last_sync_at).toLocaleString():"Never"}</span></div>}
      <div className="grid md:grid-cols-[1fr_auto] gap-4 mt-5"><div><p className="text-xs font-bold mb-2">Timeline</p><div className="space-y-2">{(app.events||[]).map((e,i)=><div key={i} className="text-sm border-l-2 border-marigold pl-3"><b>{e.status.replaceAll("_"," ")}</b><span className="text-ink/45 ml-2">{new Date(e.created_at).toLocaleString()}</span><span className="chip ml-2">{e.source==="official_api"||e.source==="official_webhook"?"Official provider":e.source==="system"?"SchemeSetu":"User entered"}</span><p className="text-xs text-ink/60">{e.message}</p></div>)}</div></div><div className="md:w-64"><label className="field"><span>Manual status update</span><select className="account-input" value={app.status} onChange={e=>update(app,{status:e.target.value,preferred_channel:"whatsapp"})}>{STATUS.map(s=><option key={s}>{s}</option>)}</select></label><label className="field"><span>Application/reference ID</span><input className="account-input" value={app.application_reference||""} onChange={e=>update(app,{application_reference:e.target.value})} placeholder="e.g. official application ID" /></label><button type="button" className="btn-secondary w-full mt-2" disabled={!level3.configured||!app.application_reference||app.tracking_mode==="automatic"} onClick={()=>update(app,{tracking_mode:"automatic"})}>Enable automatic tracking</button><button type="button" className="btn-secondary w-full mt-2" disabled={app.tracking_mode!=="automatic"} onClick={()=>update(app,{tracking_mode:"manual"})}>Switch to manual tracking</button><a href={(app.application_link||"#")} target="_blank" rel="noreferrer" className="btn-secondary w-full mt-2">Official portal ↗</a></div></div>
      <div className="text-xs text-ink/55 border-t border-ink/10 mt-5 pt-4 space-y-1"><p><b>Tracking mode:</b> {app.tracking_mode==="automatic"?"Automatic · authorized provider":"Manual · you update the status"}</p><p>{level3.configured?"An authorized provider endpoint is configured. Automatic checks run in the background when enabled.":"Automatic tracking is waiting for official API access. SchemeSetu will not guess or scrape government status."}</p>{level3.reason&&<p>{level3.reason}</p>}{app.last_sync_at&&<p>Last provider check: {new Date(app.last_sync_at).toLocaleString()}</p>}{app.sync_error&&<p className="text-red-700">Last sync issue: {app.sync_error}</p>}</div>
      </article>})}</div>}
  </div>;
}
