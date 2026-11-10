const crypto = require("crypto");

const SESSION_DAYS = 30;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || "").trim().replace(/[\s()-]/g, "");
}

function validPhone(phone) {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  try {
    const [salt, expected] = String(stored).split(":");
    const actual = crypto.scryptSync(String(password), salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
  } catch { return false; }
}

function newSessionToken() { return crypto.randomBytes(32).toString("hex"); }
function hashToken(token) { return crypto.createHash("sha256").update(token).digest("hex"); }
function sessionExpiry() { return new Date(Date.now() + SESSION_DAYS * 86400000).toISOString(); }

function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map(x => x.trim()).filter(Boolean).map(pair => {
    const i = pair.indexOf("=");
    return i < 0 ? [pair, ""] : [pair.slice(0, i), decodeURIComponent(pair.slice(i + 1))];
  }));
}

function setSessionCookie(res, token) {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `schemesetu_session=${encodeURIComponent(token)}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax${secure}`);
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `schemesetu_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secure}`);
}

module.exports = { normalizeEmail, normalizePhone, validPhone, hashPassword, verifyPassword, newSessionToken, hashToken, sessionExpiry, parseCookies, setSessionCookie, clearSessionCookie, SESSION_DAYS };
