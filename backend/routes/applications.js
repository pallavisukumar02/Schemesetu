const express = require("express");
const fs = require("fs");
const path = require("path");
const { db } = require("../models/db");
const { requireAuth } = require("../middleware/auth");
const { sendApplicationUpdate } = require("../services/notifications");

const router = express.Router();
router.use(requireAuth);
const schemes = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "schemes.json"), "utf8"));
const STATUS = ["matched","preparing","applied","under_review","approved","rejected"];

function hydrate(row) {
  if (!row) return null;
  const scheme = schemes.find(s => s.id === row.scheme_id);
  return { ...row, application_link: scheme?.application_link || null, match_reasons: row.match_reasons ? JSON.parse(row.match_reasons) : [], events: db.prepare("SELECT status,message,created_at FROM application_events WHERE application_id=? ORDER BY id ASC").all(row.id) };
}

router.get("/", (req,res) => {
  const rows = db.prepare("SELECT * FROM applications WHERE user_id=? ORDER BY last_updated DESC").all(req.user.id);
  res.json({ applications: rows.map(hydrate) });
});

router.post("/", async (req,res) => {
  const { scheme_id, status="matched", match_score=null, match_reasons=[], application_reference="", notes="", preferred_channel="whatsapp" } = req.body || {};
  const scheme = schemes.find(s => s.id === scheme_id);
  if (!scheme) return res.status(404).json({ error: "Scheme not found" });
  if (!STATUS.includes(status)) return res.status(400).json({ error: "Invalid application status" });
  const existing = db.prepare("SELECT * FROM applications WHERE user_id=? AND scheme_id=?").get(req.user.id, scheme_id);
  let application;
  if (existing) {
    db.prepare(`UPDATE applications SET status=?, match_score=COALESCE(?,match_score), match_reasons=COALESCE(?,match_reasons), application_reference=COALESCE(NULLIF(?,''),application_reference), notes=COALESCE(NULLIF(?,''),notes), last_updated=datetime('now') WHERE id=?`).run(status, match_score, match_reasons.length ? JSON.stringify(match_reasons) : null, application_reference, notes, existing.id);
    application = db.prepare("SELECT * FROM applications WHERE id=?").get(existing.id);
  } else {
    const info = db.prepare(`INSERT INTO applications (user_id,scheme_id,scheme_name,ministry,status,match_score,match_reasons,application_reference,notes) VALUES (?,?,?,?,?,?,?,?,?)`).run(req.user.id, scheme.id, scheme.name, scheme.ministry, status, match_score, JSON.stringify(match_reasons), application_reference, notes);
    application = db.prepare("SELECT * FROM applications WHERE id=?").get(info.lastInsertRowid);
    db.prepare("INSERT INTO application_events (application_id,status,message) VALUES (?,?,?)").run(application.id,status,`Application added to your SchemeSetu tracker`);
  }
  const hydrated = hydrate(application);
  const message = `SchemeSetu update: ${scheme.name} is now marked “${status.replaceAll("_"," ")}”.${application_reference ? ` Ref: ${application_reference}.` : ""} Open SchemeSetu to view your timeline.`;
  const notification = await sendApplicationUpdate(req.user, application, message, preferred_channel);
  res.json({ application: hydrated, notification });
});

router.patch("/:id", async (req,res) => {
  const application = db.prepare("SELECT * FROM applications WHERE id=? AND user_id=?").get(req.params.id, req.user.id);
  if (!application) return res.status(404).json({ error: "Application not found" });
  const { status, application_reference, notes, preferred_channel="whatsapp" } = req.body || {};
  if (status && !STATUS.includes(status)) return res.status(400).json({ error: "Invalid application status" });
  const nextStatus = status || application.status;
  const changed = nextStatus !== application.status;
  db.prepare(`UPDATE applications SET status=?, application_reference=?, notes=?, applied_date=CASE WHEN ?='applied' AND applied_date IS NULL THEN datetime('now') ELSE applied_date END, last_updated=datetime('now') WHERE id=? AND user_id=?`).run(nextStatus, application_reference ?? application.application_reference ?? "", notes ?? application.notes ?? "", nextStatus, application.id, req.user.id);
  if (changed) {
    const message = `SchemeSetu update: ${application.scheme_name} → ${nextStatus.replaceAll("_"," ")}.${application_reference ? ` Ref: ${application_reference}.` : ""} Check your SchemeSetu tracker for details.`;
    db.prepare("INSERT INTO application_events (application_id,status,message) VALUES (?,?,?)").run(application.id,nextStatus,message);
    const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id);
    await sendApplicationUpdate(user, { ...application, id: application.id }, message, preferred_channel);
  }
  res.json({ application: hydrate(db.prepare("SELECT * FROM applications WHERE id=?").get(application.id)) });
});

router.get("/:id", (req,res) => {
  const application = db.prepare("SELECT * FROM applications WHERE id=? AND user_id=?").get(req.params.id, req.user.id);
  if (!application) return res.status(404).json({ error: "Application not found" });
  res.json({ application: hydrate(application) });
});

module.exports = router;
