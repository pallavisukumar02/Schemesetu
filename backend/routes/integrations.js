const express = require('express');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');
const { db } = require('../models/db');
const { getIntegration } = require('../integrations/registry');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const schemes = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'schemes.json'), 'utf8'));
const STATUS = ['matched','preparing','applied','under_review','approved','rejected'];

function hostAllowed(url, allowedDomains) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return allowedDomains.some(d => host === d || host.endsWith(`.${d}`));
  } catch { return false; }
}

function normaliseStatus(raw) {
  const value = String(raw || '').toLowerCase().trim().replace(/[-\s]+/g, '_');
  const aliases = { submitted:'applied', sanction:'approved', sanctioned:'approved', declined:'rejected', rejected:'rejected', processing:'under_review', under_review:'under_review', review:'under_review', approved:'approved', matched:'matched', preparing:'preparing', applied:'applied' };
  return aliases[value] || (STATUS.includes(value) ? value : null);
}

router.get('/catalog', (req, res) => {
  res.json({
    levels: [
      { level: 1, name: 'Official portal handoff', live: true, description: 'Open the government/official application portal. SchemeSetu never submits on behalf of the applicant.' },
      { level: 2, name: 'Official portal verification', live: true, description: 'Check that the configured official portal is reachable and show the verified source/domain. This is not application-status data.' },
      { level: 3, name: 'Authorized status integration', live: Boolean(process.env.PMEGP_STATUS_API_URL || process.env.JANSAMARTH_STATUS_API_URL), description: 'Sync an application status only when an authorized API or signed webhook is configured.' }
    ],
    integrations: Object.fromEntries(Object.entries(require('../integrations/registry').registry).map(([id, x]) => [id, { provider:x.provider, portalUrl:x.portalUrl, applicationUrl:x.applicationUrl, level3Configured:Boolean(x.statusApiEnv && process.env[x.statusApiEnv]), notes:x.notes }]))
  });
});

router.get('/application/:id', requireAuth, async (req,res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!app) return res.status(404).json({ error:'Application not found' });
  const integration = getIntegration(app.scheme_id);
  let portal = { reachable:null, url: integration.portalUrl || null, hostVerified: integration.portalUrl ? hostAllowed(integration.portalUrl, integration.officialDomains) : false };
  if (integration.portalUrl && portal.hostVerified) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      const response = await fetch(integration.portalUrl, { method:'GET', redirect:'manual', signal:controller.signal, headers:{'User-Agent':'SchemeSetu-Official-Portal-Health/1.0'} });
      clearTimeout(timer);
      portal.reachable = response.status >= 200 && response.status < 500;
      portal.httpStatus = response.status;
    } catch (e) {
      portal.reachable = false;
      portal.error = e.name === 'AbortError' ? 'timeout' : 'network_error';
    }
  }
  res.json({
    level1: { applicationUrl: integration.applicationUrl || schemes.find(s=>s.id===app.scheme_id)?.application_link || null },
    level2: { ...portal, statement:'Portal reachability only; this does not read the government application status.' },
    level3: { configured:Boolean(integration.statusApiEnv && process.env[integration.statusApiEnv]), source: integration.statusApiEnv ? 'authorized API/webhook' : null, lastSyncAt: app.last_sync_at || null, officialStatus: app.official_status || null, officialMessage: app.official_message || null, syncError: app.sync_error || null },
    integration: { provider: integration.provider, notes: integration.notes }
  });
});

router.post('/sync/:id', requireAuth, async (req,res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!app) return res.status(404).json({ error:'Application not found' });
  const integration = getIntegration(app.scheme_id);
  const endpoint = integration.statusApiEnv ? process.env[integration.statusApiEnv] : null;
  if (!endpoint) return res.status(409).json({ error:'Level 3 is not configured for this scheme. Add an authorized official status API endpoint first.', code:'INTEGRATION_NOT_CONFIGURED' });
  if (!hostAllowed(endpoint, integration.officialDomains)) return res.status(400).json({ error:'Configured endpoint is outside the official allowlist.', code:'OFFICIAL_HOST_REQUIRED' });
  if (!app.application_reference) return res.status(400).json({ error:'Add the official application/reference ID before syncing.', code:'REFERENCE_REQUIRED' });
  try {
    const url = new URL(endpoint);
    url.searchParams.set('application_reference', app.application_reference);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, { headers:{ Accept:'application/json', 'User-Agent':'SchemeSetu-Authorized-Status-Client/1.0' }, signal:controller.signal });
    clearTimeout(timer);
    const payload = await response.json().catch(()=>({}));
    if (!response.ok) throw new Error(`Official endpoint returned HTTP ${response.status}`);
    const next = normaliseStatus(payload.status || payload.application_status || payload.stage);
    if (!next) throw new Error('Official endpoint response did not contain a recognized status.');
    db.prepare(`UPDATE applications SET status=?, official_status=?, official_message=?, last_sync_at=datetime('now'), sync_error=NULL, last_updated=datetime('now') WHERE id=?`).run(next, String(payload.status || payload.application_status || payload.stage), String(payload.message || payload.detail || ''), app.id);
    db.prepare('INSERT INTO application_events (application_id,status,message) VALUES (?,?,?)').run(app.id,next,`Official integration sync: ${next.replaceAll('_',' ')}`);
    return res.json({ ok:true, source:'official_api', application: db.prepare('SELECT * FROM applications WHERE id=?').get(app.id) });
  } catch (e) {
    db.prepare(`UPDATE applications SET last_sync_at=datetime('now'), sync_error=? WHERE id=?`).run(e.message, app.id);
    return res.status(502).json({ error:'Official status sync failed', detail:e.message, code:'OFFICIAL_SYNC_FAILED' });
  }
});

// Signed webhook for an authority/integration partner. The provider sends JSON:
// { application_reference, status, message, scheme_id }
router.post('/webhook/:provider', (req,res) => {
  const provider = req.params.provider;
  const map = provider === 'pmegp' ? getIntegration('pmegp') : getIntegration('standup-india');
  const secret = map.webhookSecretEnv ? process.env[map.webhookSecretEnv] : null;
  if (!secret) return res.status(404).json({ error:'Webhook integration not configured' });
  const signature = req.get('x-schemesetu-signature') || '';
  const raw = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  if (!signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return res.status(401).json({ error:'Invalid signature' });
  const payload = req.body || {};
  const next = normaliseStatus(payload.status);
  if (!payload.application_reference || !next) return res.status(400).json({ error:'application_reference and valid status are required' });
  const app = db.prepare('SELECT * FROM applications WHERE application_reference=? ORDER BY id DESC LIMIT 1').get(payload.application_reference);
  if (!app) return res.status(404).json({ error:'No SchemeSetu application matches this reference' });
  db.prepare(`UPDATE applications SET status=?, official_status=?, official_message=?, last_sync_at=datetime('now'), sync_error=NULL, last_updated=datetime('now') WHERE id=?`).run(next, String(payload.status), String(payload.message || ''), app.id);
  db.prepare('INSERT INTO application_events (application_id,status,message) VALUES (?,?,?)').run(app.id,next,`Signed official webhook update: ${next.replaceAll('_',' ')}`);
  res.json({ ok:true });
});

module.exports = router;
