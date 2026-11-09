import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const API_BASE = "/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then(async r => r.ok ? (await r.json()).user : null)
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function signup(payload) {
    const r = await fetch(`${API_BASE}/auth/signup`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "Could not create account");
    setUser(d.user); return d.user;
  }

  async function login(email, password) {
    const r = await fetch(`${API_BASE}/auth/login`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "Could not sign in");
    setUser(d.user); return d.user;
  }

  async function updateProfile(fields) {
    const r = await fetch(`${API_BASE}/auth/profile`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "Could not save profile");
    setUser(d.user); return { user: d.user };
  }

  async function logout() {
    await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, signup, login, updateProfile, logout, API_BASE }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
