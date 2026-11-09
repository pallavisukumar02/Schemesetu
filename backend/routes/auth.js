const express = require("express");
const { db } = require("../models/db");
const { normalizeEmail, normalizePhone, validPhone, hashPassword, verifyPassword, newSessionToken, hashToken, sessionExpiry, setSessionCookie, clearSessionCookie } = require("../auth");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function publicUser(row) {
  if (!row) return null;
  const { password_hash, ...safe } = row;
  return safe;
}

function createSession(res, userId) {
  const token = newSessionToken();
  db.prepare("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)").run(userId, hashToken(token), sessionExpiry());
  setSessionCookie(res, token);
}

router.post("/signup", (req, res) => {
  try {
    const { name, email, phone_number, password, whatsapp_opt_in = false } = req.body || {};
    const normalizedEmail = normalizeEmail(email);
    const phone = normalizePhone(phone_number);
    if (!name || !normalizedEmail || !password || !phone) return res.status(400).json({ error: "Name, email, phone number and password are required" });
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return res.status(400).json({ error: "Enter a valid email address" });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
    if (!validPhone(phone)) return res.status(400).json({ error: "Use phone format like +919876543210" });
    const existing = db.prepare("SELECT id FROM users WHERE email=? OR phone_number=?").get(normalizedEmail, phone);
    if (existing) return res.status(409).json({ error: "An account already exists with that email or phone number" });
    const info = db.prepare(`INSERT INTO users (name,email,password_hash,phone_number,whatsapp_opt_in,consent_given) VALUES (?,?,?,?,?,1)`).run(name.trim(), normalizedEmail, hashPassword(password), phone, whatsapp_opt_in ? 1 : 0);
    const user = db.prepare("SELECT * FROM users WHERE id=?").get(info.lastInsertRowid);
    createSession(res, user.id);
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    console.error(err); res.status(500).json({ error: "Could not create account" });
  }
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare("SELECT * FROM users WHERE email=?").get(normalizeEmail(email));
  if (!user || !verifyPassword(password, user.password_hash)) return res.status(401).json({ error: "Incorrect email or password" });
  createSession(res, user.id);
  res.json({ user: publicUser(user) });
});

router.get("/me", requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

router.patch("/profile", requireAuth, (req, res) => {
  const allowed = ["name","phone_number","whatsapp_opt_in","age","gender","category","state","district","income_bracket","education_level","business_type","disability_status","preferred_language","photo_url","consent_given"];
  const data = Object.fromEntries(allowed.filter(k => Object.prototype.hasOwnProperty.call(req.body || {}, k)).map(k => [k, req.body[k]]));
  if (data.phone_number !== undefined) { data.phone_number = normalizePhone(data.phone_number); if (!validPhone(data.phone_number)) return res.status(400).json({ error: "Use phone format like +919876543210" }); }
  if (!Object.keys(data).length) return res.status(400).json({ error: "Nothing to update" });
  const sets = Object.keys(data).map(k => `${k}=?`);
  const values = Object.keys(data).map(k => data[k] === true ? 1 : data[k] === false ? 0 : data[k]);
  sets.push("updated_at=datetime('now')");
  try {
    db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id=?`).run(...values, req.user.id);
    res.json({ user: publicUser(db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id)) });
  } catch (err) { res.status(400).json({ error: "Could not update profile" }); }
});

router.post("/logout", (req, res) => {
  const token = require("../auth").parseCookies(req.headers.cookie || "").schemesetu_session;
  if (token) db.prepare("DELETE FROM sessions WHERE token_hash=?").run(hashToken(token));
  clearSessionCookie(res);
  res.json({ ok: true });
});

module.exports = router;
