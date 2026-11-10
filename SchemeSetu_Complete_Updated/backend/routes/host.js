const express = require("express");
const crypto = require("crypto");
const { db } = require("../models/db");

const router = express.Router();
const COOKIE = "schemesetu_host_session";
const SESSION_DAYS = 1;

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
function randomToken() {
  return crypto.randomBytes(32).toString("hex");
}
function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map(x => x.trim()).filter(Boolean).map(x => {
    const i = x.indexOf("="); return [i < 0 ? x : x.slice(0, i), i < 0 ? "" : decodeURIComponent(x.slice(i + 1))];
  }));
}
function cookieOptions(maxAge) {
  const secure = process.env.NODE_ENV === "production";
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}
function setHostCookie(res, token) { res.setHeader("Set-Cookie", `${COOKIE}=${encodeURIComponent(token)}; ${cookieOptions(SESSION_DAYS * 86400)}`); }
function clearHostCookie(res) { res.setHeader("Set-Cookie", `${COOKIE}=; ${cookieOptions(0)}`); }
function configured() { return Boolean(process.env.HOST_EMAIL && process.env.HOST_PASSWORD); }
function timingSafe(a, b) {
  const aa = Buffer.from(String(a || "")); const bb = Buffer.from(String(b || ""));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function requireHost(req, res, next) {
  const token = parseCookies(req.headers.cookie || "")[COOKIE];
  if (!token) return res.status(401).json({ error: "Host sign-in required" });
  const row = db.prepare("SELECT * FROM host_sessions WHERE token_hash=? AND expires_at > datetime('now')").get(hash(token));
  if (!row) return res.status(401).json({ error: "Host session expired" });
  req.host = { email: row.email };
  next();
}

router.get("/status", (_req, res) => res.json({ configured: configured(), environment: process.env.NODE_ENV || "development", publicOrigin: process.env.PUBLIC_ORIGIN || null }));

router.post("/login", (req, res) => {
  if (!configured()) return res.status(503).json({ error: "Host access is not configured. Add HOST_EMAIL and HOST_PASSWORD to the server environment." });
  const { email, password } = req.body || {};
  if (!timingSafe(String(email || "").trim().toLowerCase(), String(process.env.HOST_EMAIL).trim().toLowerCase()) || !timingSafe(password, process.env.HOST_PASSWORD)) {
    return res.status(401).json({ error: "Incorrect host credentials" });
  }
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString().replace("T", " ").replace(".000Z", "");
  db.prepare("INSERT INTO host_sessions (email, token_hash, expires_at) VALUES (?, ?, ?)").run(String(process.env.HOST_EMAIL).trim().toLowerCase(), hash(token), expires);
  setHostCookie(res, token);
  res.json({ ok: true, host: { email: String(process.env.HOST_EMAIL).trim().toLowerCase() } });
});

router.get("/me", requireHost, (req, res) => res.json({ host: req.host }));
router.post("/logout", (req, res) => {
  const token = parseCookies(req.headers.cookie || "")[COOKIE];
  if (token) db.prepare("DELETE FROM host_sessions WHERE token_hash=?").run(hash(token));
  clearHostCookie(res); res.json({ ok: true });
});

router.get("/overview", requireHost, (_req, res) => {
  const users = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  const applications = db.prepare("SELECT COUNT(*) AS count FROM applications").get().count;
  const approved = db.prepare("SELECT COUNT(*) AS count FROM applications WHERE status='approved'").get().count;
  const underReview = db.prepare("SELECT COUNT(*) AS count FROM applications WHERE status='under_review'").get().count;
  const notifications = db.prepare("SELECT COUNT(*) AS count FROM notifications").get().count;
  const recentUsers = db.prepare(`SELECT id,name,email,phone_number,category,state,district,business_type,preferred_language,created_at,updated_at FROM users ORDER BY id DESC LIMIT 8`).all();
  res.json({ metrics: { users, applications, approved, underReview, notifications }, recentUsers });
});

router.get("/users", requireHost, (req, res) => {
  const q = String(req.query.search || "").trim();
  const rows = q
    ? db.prepare(`SELECT id,name,email,phone_number,category,state,district,business_type,preferred_language,created_at,updated_at FROM users WHERE name LIKE ? OR email LIKE ? OR phone_number LIKE ? ORDER BY id DESC LIMIT 100`).all(`%${q}%`,`%${q}%`,`%${q}%`)
    : db.prepare(`SELECT id,name,email,phone_number,category,state,district,business_type,preferred_language,created_at,updated_at FROM users ORDER BY id DESC LIMIT 100`).all();
  res.json({ users: rows });
});

router.get("/users/:id", requireHost, (req, res) => {
  const user = db.prepare(`SELECT id,name,email,phone_number,whatsapp_opt_in,photo_url,age,gender,category,state,district,income_bracket,education_level,business_type,disability_status,preferred_language,consent_given,created_at,updated_at FROM users WHERE id=?`).get(Number(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  const applications = db.prepare(`SELECT id,scheme_id,scheme_name,ministry,status,match_score,application_reference,applied_date,last_updated,notes,official_status,official_message,last_sync_at,sync_error FROM applications WHERE user_id=? ORDER BY id DESC`).all(user.id);
  const notifications = db.prepare(`SELECT id,application_id,channel,message,status,created_at FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 30`).all(user.id);
  res.json({ user, applications, notifications });
});

module.exports = { router, requireHost };
