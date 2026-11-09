// backend/routes/schemes.js
const express = require("express");
const { loadSchemes, matchProfile } = require("../matching/matchEngine");

const router = express.Router();

// GET /api/schemes — full public list (used for the "browse all schemes" page,
// and by the PWA to cache for offline use)
router.get("/", (req, res) => {
  res.json(loadSchemes());
});

// IMPORTANT: define /match and /match/me BEFORE /:id. Otherwise Express
// interprets the literal word "match" as an :id and the logged-in match route
// never gets a chance to run.

// POST /api/schemes/match — run the engine against an arbitrary profile
// without needing to be logged in (used by the onboarding preview and WhatsApp bot).
router.post("/match", (req, res) => {
  try {
    const matches = matchProfile(req.body);
    res.json({ count: matches.length, matches });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Could not calculate scheme matches" });
  }
});

// GET /api/schemes/:id
router.get("/:id", (req, res) => {
  const scheme = loadSchemes().find((s) => s.id === req.params.id);
  if (!scheme) return res.status(404).json({ error: "Scheme not found" });
  res.json(scheme);
});

module.exports = router;
