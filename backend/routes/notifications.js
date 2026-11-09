const express = require("express");
const { db } = require("../models/db");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();
router.use(requireAuth);
router.get("/", (req,res)=>{
  const notifications = db.prepare(`SELECT n.*, a.scheme_name FROM notifications n LEFT JOIN applications a ON a.id=n.application_id WHERE n.user_id=? ORDER BY n.id DESC LIMIT 50`).all(req.user.id);
  res.json({ notifications });
});
module.exports = router;
