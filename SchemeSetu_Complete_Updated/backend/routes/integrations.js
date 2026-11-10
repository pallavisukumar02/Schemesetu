const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { db } = require('../models/db');
const { registry, getIntegration } = require('../integrations/registry');
const { getProviderConfig, syncApplication, normalizeStatus, recordStatus, verifyWebhook } = require('../services/applicationTracking');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const schemes = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'schemes.json'), 'utf8'));

router.get('/catalog', (_req, res) => {
  const integrations = Object.fromEntries(Object.entries(registry).map(([id, item]) => {
    const config = getProviderConfig(id);
    return [id, { provider: item.provider, portalUrl: item.portalUrl, applicationUrl: item.applicationUrl, level3Configured: config.configured, notes: config.configured ? 'Authorized API endpoint and host allowlist are configured.' : config.reason || item.notes }];
  }));
  res.json({ levels: [
    { level: 1, name: 'Official portal handoff', live: true, description: 'Open the government application portal and complete the application there.' },
    { level: 2, name: 'Portal reachability check', live: true, description: 'Checks whether the official portal responds. This does not reveal application status.' },
    { level: 3, name: 'Automatic status updates', live: Object.values(integrations).some(x => x.level3Configured), description: 'Background polling or signed webhooks from an authorized provider. Requires official API approval.' }
  ], integrations });
});

router.get('/application/:id', requireAuth, async (req, res) => {
  const application = db.prepare('SELECT * FROM applications WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!application) return res.status(404).json({ error: 'Application not found' });
  const integration = getIntegration(application.scheme_id);
  const config = getProviderConfig(application.scheme_id);
  const portal = { reachable: null, url: integration.portalUrl || null, hostVerified: Boolean(integration.portalUrl) };
  if (integration.portalUrl) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(integration.portalUrl, { method: 'GET', redirect: 'follow', signal: controller.signal, headers: { 'User-Agent': 'SchemeSetu-Portal-Health/1.0' } });
      portal.reachable = response.ok || (response.status >= 300 && response.status < 500);
      portal.httpStatus = response.status;
    } catch (error) { portal.reachable = false; portal.error = error.name === 'AbortError' ? 'timeout' : 'network_error'; }
    finally { clearTimeout(timer); }
  }
  res.json({
    level1: { applicationUrl: integration.applicationUrl || schemes.find(s => s.id === application.scheme_id)?.application_link || null },
    level2: { ...portal, statement: 'Portal reachability only; this does not read the government application status.' },
    level3: { configured: config.configured, source: config.configured ? 'authorized_api_or_signed_webhook' : null, trackingMode: application.tracking_mode || 'manual', lastSyncAt: application.last_sync_at || null, officialStatus: application.official_status || null, officialMessage: application.official_message || null, syncError: application.sync_error || null, reason: config.reason || null },
    integration: { provider: integration.provider, notes: integration.notes }
  });
});

router.post('/sync/:id', requireAuth, async (req, res) => {
  const application = db.prepare('SELECT * FROM applications WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!application) return res.status(404).json({ error: 'Application not found' });
  const result = await syncApplication(application);
  if (!result.ok) return res.status(result.skipped ? 409 : 502).json({ error: result.reason, code: result.skipped ? 'INTEGRATION_NOT_CONFIGURED' : 'OFFICIAL_SYNC_FAILED' });
  const updated = db.prepare('SELECT * FROM applications WHERE id=?').get(application.id);
  res.json({ ok: true, source: 'official_api', changed: result.changed, application: updated });
});

// Provider webhook contract: JSON { application_reference, scheme_id, status,
// message?, event_id? }; HMAC-SHA256 hex signature in x-schemesetu-signature.
router.post('/webhook/:provider', (req, res) => {
  const provider = String(req.params.provider || '').toLowerCase();
  const providerMap = {
    pmegp: { integration: getIntegration('pmegp'), schemes: ['pmegp'] },
    jansamarth: { integration: getIntegration('standup-india'), schemes: ['standup-india', 'mudra-shishu', 'mudra-kishor'] },
    pmsvanidhi: { integration: getIntegration('pm-svanidhi'), schemes: ['pm-svanidhi'] }
  };
  const selected = providerMap[provider];
  if (!selected) return res.status(404).json({ error: 'Unknown provider webhook' });
  const secret = selected.integration.webhookSecretEnv ? process.env[selected.integration.webhookSecretEnv] : null;
  if (!verifyWebhook(req.rawBody || Buffer.from(JSON.stringify(req.body || {})), req.get('x-schemesetu-signature'), secret)) return res.status(401).json({ error: 'Invalid webhook signature' });
  const payload = req.body || {};
  const status = normalizeStatus(payload.status);
  if (!payload.application_reference || !status || !payload.scheme_id || !selected.schemes.includes(payload.scheme_id)) return res.status(400).json({ error: 'A matching scheme_id, application_reference and recognized status are required.' });
  const application = db.prepare('SELECT * FROM applications WHERE scheme_id=? AND application_reference=? ORDER BY id DESC LIMIT 1').get(payload.scheme_id, payload.application_reference);
  if (!application) return res.status(404).json({ error: 'No matching SchemeSetu application reference found.' });
  const result = recordStatus(application, status, String(payload.message || 'Official provider webhook update.'), 'official_webhook', payload.event_id ? String(payload.event_id) : null, String(payload.status));
  res.json({ ok: true, duplicate: Boolean(result.duplicate), changed: Boolean(result.changed) });
});

module.exports = router;
