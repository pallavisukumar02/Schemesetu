// backend/server.js
//
// IMPORTANT: always resolve .env relative to this file's location, not to
// process.cwd(). If we used the default `require("dotenv").config()`, the
// .env at the project root would only load when you happen to launch the
// server from the project root — running `npm run dev` from inside /backend
// (the normal case) would silently load NO env vars, falling back to
// hardcoded defaults (e.g. JWT_SECRET). That's harmless as long as you're
// always consistent about where you start the server from, but the moment
// you start it from a different directory even once, tokens signed under
// one JWT_SECRET stop verifying under the other — which shows up as a
// confusing "Invalid or expired session" error even though nothing expired.
require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");

const schemesRouter = require("./routes/schemes");
const chatRouter = require("./routes/chat");
const authRouter = require("./routes/auth");
const applicationsRouter = require("./routes/applications");
const notificationsRouter = require("./routes/notifications");
const integrationsRouter = require("./routes/integrations");
const hostRouter = require("./routes/host").router;

// Initialize/upgrade the SQLite schema on every start.
const fs = require("fs");
const db = require("./models/db").db;
const schemaPath = require("path").resolve(__dirname, "..", "database", "schema.sql");
db.exec(fs.readFileSync(schemaPath, "utf8"));
// Backward-compatible migration for users upgrading from v7.
for (const sql of [
  "ALTER TABLE applications ADD COLUMN official_status TEXT",
  "ALTER TABLE applications ADD COLUMN official_message TEXT",
  "ALTER TABLE applications ADD COLUMN last_sync_at TEXT",
  "ALTER TABLE applications ADD COLUMN sync_error TEXT",
  "ALTER TABLE applications ADD COLUMN tracking_mode TEXT NOT NULL DEFAULT 'manual'",
  "ALTER TABLE applications ADD COLUMN tracking_consent_at TEXT",
  "ALTER TABLE application_events ADD COLUMN source TEXT NOT NULL DEFAULT 'user'",
  "ALTER TABLE application_events ADD COLUMN provider_event_id TEXT",
  "ALTER TABLE application_events ADD COLUMN raw_status TEXT"
]) { try { db.exec(sql); } catch (e) { if (!String(e.message).includes("duplicate column name")) throw e; } }

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || true, credentials: true }));
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});
app.use(express.json({
  limit: "2mb",
  verify: (req, _res, buf) => { req.rawBody = Buffer.from(buf); }
})); // keep raw JSON for signed integration webhooks

app.use("/api/schemes", schemesRouter);
app.use("/api/chat", chatRouter);
app.use("/api/auth", authRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/integrations", integrationsRouter);
app.use("/api/host", hostRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// In production the same Express origin serves the built React application.
const frontendDist = require("path").resolve(__dirname, "..", "frontend", "dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => req.path.startsWith("/api/") ? next() : res.sendFile(require("path").join(frontendDist, "index.html")));
}

const { startStatusSyncWorker } = require("./services/statusSyncWorker");
startStatusSyncWorker();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`SchemeSetu backend running on http://localhost:${PORT}`);
  console.log(`Loaded env from: ${require("path").resolve(__dirname, "..", ".env")}`);
});
