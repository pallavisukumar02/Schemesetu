const { db } = require('../models/db');
const { syncApplication } = require('./applicationTracking');

let timer = null;
let running = false;
async function runSyncBatch() {
  if (running) return;
  running = true;
  try {
    const rows = db.prepare(`SELECT * FROM applications
      WHERE tracking_mode='automatic' AND application_reference IS NOT NULL AND application_reference<>''
      AND (last_sync_at IS NULL OR datetime(last_sync_at) <= datetime('now','-15 minutes'))
      ORDER BY COALESCE(last_sync_at,'1970-01-01') ASC LIMIT 25`).all();
    for (const app of rows) await syncApplication(app);
  } catch (error) { console.error('[tracker-worker]', error.message); }
  finally { running = false; }
}
function startStatusSyncWorker() {
  if (timer || process.env.DISABLE_STATUS_SYNC_WORKER === 'true') return;
  const interval = Math.max(60, Number(process.env.STATUS_SYNC_INTERVAL_SECONDS || 900)) * 1000;
  timer = setInterval(runSyncBatch, interval);
  if (typeof timer.unref === 'function') timer.unref();
  setTimeout(runSyncBatch, 15000).unref?.();
  console.log(`[tracker-worker] enabled; interval ${Math.round(interval / 1000)} seconds`);
}
module.exports = { startStatusSyncWorker, runSyncBatch };
