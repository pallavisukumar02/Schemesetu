import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import AppHome from "./pages/AppHome.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import SchemeDetail from "./pages/SchemeDetail.jsx";
import NearbyBanks from "./pages/NearbyBanks.jsx";
import Prepare from "./pages/Prepare.jsx";
import Compare from "./pages/Compare.jsx";
import Opportunities from "./pages/Opportunities.jsx";
import Toolkit from "./pages/Toolkit.jsx";
import Privacy from "./pages/Privacy.jsx";
import ChatAssistant from "./components/ChatAssistant.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Tracker from "./pages/Tracker.jsx";
import Integrations from "./pages/Integrations.jsx";
import Host from "./pages/Host.jsx";

export default function App(){
  const location = useLocation();
  const splash = location.pathname === "/";
  return <div className="min-h-screen bg-paper text-ink flex flex-col">
    {!splash && <Navbar/>}
    <main className="flex-1">
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/app" element={<AppHome/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/signup" element={<Signup/>}/>
        <Route path="/onboarding" element={<Onboarding/>}/>
        <Route path="/tracker" element={<Tracker/>}/>
        <Route path="/integrations" element={<Integrations/>}/>
        <Route path="/host" element={<Host/>}/>
        <Route path="/dashboard" element={<Dashboard/>}/>
        <Route path="/banks" element={<NearbyBanks/>}/>
        <Route path="/schemes/:id" element={<SchemeDetail/>}/>
        <Route path="/prepare/:id" element={<Prepare/>}/>
        <Route path="/compare" element={<Compare/>}/>
        <Route path="/opportunities" element={<Opportunities/>}/>
        <Route path="/toolkit" element={<Toolkit/>}/>
        <Route path="/privacy" element={<Privacy/>}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </main>
    {!splash && <ChatAssistant/>}
  </div>
}
