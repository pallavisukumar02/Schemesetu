import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Integrations(){
  const [data,setData]=useState(null);
  useEffect(()=>{fetch('/api/integrations/catalog').then(r=>r.json()).then(setData).catch(()=>{});},[]);
  const levels=data?.levels||[
    {level:1,name:'Official portal handoff',live:true,description:'Open the official scheme portal.'},
    {level:2,name:'Official portal verification',live:true,description:'Verify the official portal is reachable.'},
    {level:3,name:'Authorized status integration',live:false,description:'Requires an official API/webhook contract.'}
  ];
  return <div className="max-w-6xl mx-auto px-5 py-10">
    <div className="hero-panel mb-7"><div><p className="eyebrow">INTEGRATION ARCHITECTURE</p><h1 className="font-display text-3xl">Three levels of government connectivity</h1><p className="text-ink/60 mt-2 max-w-3xl">SchemeSetu never pretends to have government access it does not have. Level 1 is live now, Level 2 verifies official portals, and Level 3 is a secure adapter ready for an authorized status API or signed webhook.</p></div><Link to="/tracker" className="btn-secondary">Open tracker</Link></div>
    <div className="grid md:grid-cols-3 gap-4 mb-7">{levels.map(x=><section key={x.level} className="panel"><span className={x.live?'badge-green':'badge-gold'}>{x.live?'READY':'REQUIRES AUTHORIZATION'}</span><p className="eyebrow mt-4">LEVEL {x.level}</p><h2 className="font-display text-xl">{x.name}</h2><p className="text-sm text-ink/60 mt-2">{x.description}</p></section>)}</div>
    <section className="panel mb-6"><p className="eyebrow">HOW STATUS FLOWS</p><div className="grid md:grid-cols-5 gap-3 items-center text-sm mt-4">{['Profile match','Official portal','Application ID','Authorized API / webhook','SchemeSetu tracker'].map((x,i)=><div key={x} className="mini-card"><b>{i+1}. {x}</b><span>{i===3?'Only when the authority provides access.':'Handled by the appropriate layer.'}</span></div>)}</div></section>
    <section className="panel"><p className="eyebrow">CONFIGURED CONNECTORS</p><div className="space-y-3 mt-4">{Object.entries(data?.integrations||{}).map(([id,x])=><div key={id} className="border border-ink/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3"><div><b>{x.provider}</b><p className="text-xs text-ink/55 mt-1">{x.notes}</p></div><span className={x.level3Configured?'badge-green':'badge-gold'}>{x.level3Configured?'Level 3 configured':'Level 3 not connected'}</span></div>)}</div><p className="text-xs text-ink/45 mt-5">For the hackathon, the app includes the integration contract and security checks. Do not enter credentials or API URLs unless the official authority has provided them.</p></section>
  </div>
}
