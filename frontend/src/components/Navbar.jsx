import { Link, useLocation } from "react-router-dom";
import LanguageToggle from "./LanguageToggle.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const workspace = [{to:"/dashboard",label:"Dashboard"},{to:"/tracker",label:"My tracker"},{to:"/compare",label:"Compare"}];
const explore = [{to:"/onboarding",label:"Find schemes"},{to:"/opportunities",label:"Opportunities"},{to:"/banks",label:"Support nearby"},{to:"/toolkit",label:"Toolkit"}];
export default function Navbar(){
  const {user,loading,logout}=useAuth(); const location=useLocation();
  const active=(to)=>location.pathname===to||location.pathname.startsWith(`${to}/`);
  return <header className="app-topbar sticky top-0 z-40"><div className="max-w-[1380px] mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-4">
    <Link to="/" className="flex items-center gap-2.5 shrink-0"><span className="brand-mark">S</span><span className="font-display text-xl tracking-tight text-ink">SchemeSetu</span></Link>
    <nav className="hidden lg:flex items-center gap-1">
      {explore.map(x=><Link key={x.to} to={x.to} className={`nav-link ${active(x.to)?"active":""}`}>{x.label}</Link>)}
      {user&&workspace.map(x=><Link key={x.to} to={x.to} className={`nav-link ${active(x.to)?"active":""}`}>{x.label}</Link>)}
    </nav>
    <div className="flex items-center gap-2 ml-auto"><LanguageToggle/>{user?<><Link to="/onboarding" className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-ink text-paper text-xs font-bold"><span className="w-6 h-6 rounded-md bg-white/10 grid place-items-center">{(user.name||"U").slice(0,1).toUpperCase()}</span>{user.name?.split(" ")[0]||"Account"}</Link><button onClick={logout} className="hidden md:inline nav-link">Sign out</button></>:!loading&&<Link to="/login" className="btn-small">Sign in</Link>}</div>
  </div></header>
}
