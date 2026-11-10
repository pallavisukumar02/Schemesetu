const crypto = require('crypto');
const { db } = require('../models/db');
const { getIntegration } = require('../integrations/registry');

const STATUS_MAP = {
  submitted: 'applied', application_submitted: 'applied', applied: 'applied',
  pending: 'under_review', processing: 'under_review', scrutiny: 'under_review',
  under_review: 'under_review', pending_scrutiny: 'under_review',
  query_raised: 'action_required', clarification_required: 'action_required', action_required: 'action_required',
  sanctioned: 'approved', sanction: 'approved', approved: 'approved',
  declined: 'rejected', rejected: 'rejected', disbursed: 'disbursed',
  matched: 'matched', preparing: 'preparing'
};

function normalizeStatus(raw) {
  const key = String(raw || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  return STATUS_MAP[key] || null;
}

function recordStatus(application, status, message, source, providerEventId = null, rawStatus = null) {
  const existing = providerEventId
    ? db.prepare('SELECT id FROM application_events WHERE provider_event_id=?').get(providerEventId)
    : null;
  if (existing) return { changed: false, duplicate: true };
  const previous = application.status;
  const changed = previous !== status;
  let eventId = null;
  // Avoid filling the timeline with identical polling results. Provider event IDs
  // are still recorded once even if the normalized status has not changed.
  if (changed || providerEventId) {
    const insert = db.prepare(`INSERT INTO application_events
      (application_id,status,message,source,provider_event_id,raw_status)
      VALUES (?,?,?,?,?,?)`).run(application.id, status, message || `Status updated to ${status.replaceAll('_', ' ')}`, source, providerEventId, rawStatus);
    eventId = insert.lastInsertRowid;
  }
  if (changed) {
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(application.user_id);
    if (user) {
      const { sendApplicationUpdate } = require('./notifications');
      sendApplicationUpdate(user, application, `Official update for ${application.scheme_name}: ${status.replaceAll('_', ' ')}. ${message || ''}`, 'whatsapp').catch(error => console.error('[tracker-notification]', error.message));
    }
    db.prepare(`UPDATE applications SET status=?, official_status=?, official_message=?,
      last_sync_at=datetime('now'), sync_error=NULL, last_updated=datetime('now') WHERE id=?`)
      .run(status, rawStatus || status, message || '', application.id);
  } else {
    db.prepare(`UPDATE applications SET official_status=?, official_message=?,
      last_sync_at=datetime('now'), sync_error=NULL WHERE id=?`)
      .run(rawStatus || status, message || '', application.id);
  }
  return { changed, eventId };
}

function getProviderConfig(schemeId) {
  const integration = getIntegration(schemeId);
  const endpoint = integration.statusApiEnv ? process.env[integration.statusApiEnv] : null;
  const token = integration.statusTokenEnv ? process.env[integration.statusTokenEnv] : null;
  const allowedHosts = integration.allowedHostsEnv
    ? String(process.env[integration.allowedHostsEnv] || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean)
    : [];
  if (!endpoint) return { configured: false, reason: 'No authorized status API endpoint is configured.' };
  let url;
  try { url = new URL(endpoint); } catch { return { configured: false, reason: 'The configured status API URL is invalid.' }; }
  if (url.protocol !== 'https:') return { configured: false, reason: 'The status API must use HTTPS.' };
  if (!allowedHosts.includes(url.hostname.toLowerCase())) return { configured: false, reason: 'The API host is not in the explicitly configured provider allowlist.' };
  return { configured: true, endpoint: url.toString(), token, integration };
}

async function syncApplication(application) {
  const config = getProviderConfig(application.scheme_id);
  if (!config.configured) return { ok: false, skipped: true, reason: config.reason };
  if (!application.application_reference) return { ok: false, skipped: true, reason: 'Add the official application reference first.' };
  const url = new URL(config.endpoint);
  url.searchParams.set('application_reference', application.application_reference);
  url.searchParams.set('scheme_id', application.scheme_id);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const headers = { Accept: 'application/json', 'User-Agent': 'SchemeSetu-Authorized-Status-Client/1.0' };
    if (config.token) headers.Authorization = `Bearer ${config.token}`;
    const response = await fetch(url, { headers, signal: controller.signal });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Provider API returned HTTP ${response.status}`);
    const rawStatus = payload.status || payload.application_status || payload.stage;
    const status = normalizeStatus(rawStatus);
    if (!status) throw new Error('Provider response has no recognized status field. Expected status, application_status, or stage.');
    const result = recordStatus(application, status, String(payload.message || payload.detail || 'Official provider status received.'), 'official_api', payload.event_id ? String(payload.event_id) : null, String(rawStatus));
    return { ok: true, changed: result.changed, status };
  } catch (error) {
    db.prepare("UPDATE applications SET last_sync_at=datetime('now'), sync_error=? WHERE id=?").run(error.message, application.id);
    return { ok: false, reason: error.message };
  } finally { clearTimeout(timer); }
}

function verifyWebhook(rawBody, signature, secret) {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { normalizeStatus, recordStatus, getProviderConfig, syncApplication, verifyWebhook };
