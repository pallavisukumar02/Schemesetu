// database/seed.js
//
// Creates schemesetu.db (SQLite) from schema.sql. Safe to run multiple times —
// it only creates tables if they don't already exist, it never drops data.
//
// Run with:  npm run seed   (from /backend — see backend/package.json)
// or:        node database/seed.js   (from the project root)
//
// NOTE: this reuses the DB connection from backend/models/db.js rather than
// requiring better-sqlite3 directly. That's not just tidiness — database/ and
// backend/ are sibling folders, so a direct `require("better-sqlite3")` here
// would fail to resolve (Node only looks in node_modules of the requiring
// file's own ancestor directories, and better-sqlite3 is only installed
// under backend/node_modules). Going through backend/models/db.js sidesteps
// that entirely.

const fs = require("fs");
const path = require("path");
const { db } = require("../backend/models/db");

const SCHEMA_PATH = path.join(__dirname, "schema.sql");
const schema = fs.readFileSync(SCHEMA_PATH, "utf8");

db.exec(schema);

console.log(`✔ Database ready at ${path.join(__dirname, "..", "schemesetu.db")}`);
console.log("✔ Tables: users, sessions, applications, application_events, notifications");
console.log(
  "ℹ schemes.json is read directly by the matching engine at request time — " +
    "it is NOT copied into a database table, so editing schemes.json takes effect immediately."
);
