const { db } = require("../models/db");
const { parseCookies, hashToken } = require("../auth");

function getUserFromRequest(req) {
  const token = parseCookies(req.headers.cookie || "").schemesetu_session;
  if (!token) return null;
  const row = db.prepare(`SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at > datetime('now')`).get(hashToken(token));
  return row || null;
}

function requireAuth(req, res, next) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Please sign in to continue" });
  req.user = user;
  next();
}

module.exports = { getUserFromRequest, requireAuth };
