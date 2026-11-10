// Provider adapters are deliberately configuration-driven. SchemeSetu only
// polls endpoints explicitly supplied and allowlisted by an authorized provider.
const registry = {
  pmegp: {
    provider: 'PMEGP / KVIC', portalUrl: 'https://common-pmegp.msme.gov.in/',
    applicationUrl: 'https://www.kviconline.gov.in/pmegpeportal/',
    officialDomains: ['common-pmegp.msme.gov.in', 'www.kviconline.gov.in', 'pmegp.msme.gov.in'],
    statusApiEnv: 'PMEGP_STATUS_API_URL', statusTokenEnv: 'PMEGP_STATUS_API_TOKEN',
    allowedHostsEnv: 'PMEGP_STATUS_API_ALLOWED_HOSTS', webhookSecretEnv: 'PMEGP_WEBHOOK_SECRET',
    notes: 'Live status polling is enabled only after the authority provides an API contract, credentials and approved API hostname.'
  },
  'standup-india': {
    provider: 'Stand-Up India / JanSamarth', portalUrl: 'https://www.jansamarth.in/home',
    applicationUrl: 'https://www.jansamarth.in/home',
    officialDomains: ['www.jansamarth.in', 'jansamarth.in', 'financialservices.gov.in'],
    statusApiEnv: 'JANSAMARTH_STATUS_API_URL', statusTokenEnv: 'JANSAMARTH_STATUS_API_TOKEN',
    allowedHostsEnv: 'JANSAMARTH_STATUS_API_ALLOWED_HOSTS', webhookSecretEnv: 'JANSAMARTH_WEBHOOK_SECRET',
    notes: 'JanSamarth status sync requires approved API access and a provider-defined response contract.'
  },
  'mudra-shishu': { provider: 'MUDRA / JanSamarth', portalUrl: 'https://www.jansamarth.in/home', applicationUrl: 'https://www.jansamarth.in/home', officialDomains: ['www.jansamarth.in','jansamarth.in','financialservices.gov.in'], statusApiEnv: 'JANSAMARTH_STATUS_API_URL', statusTokenEnv: 'JANSAMARTH_STATUS_API_TOKEN', allowedHostsEnv: 'JANSAMARTH_STATUS_API_ALLOWED_HOSTS', webhookSecretEnv: 'JANSAMARTH_WEBHOOK_SECRET', notes: 'Live status sync requires approved JanSamarth API access.' },
  'mudra-kishor': { provider: 'MUDRA / JanSamarth', portalUrl: 'https://www.jansamarth.in/home', applicationUrl: 'https://www.jansamarth.in/home', officialDomains: ['www.jansamarth.in','jansamarth.in','financialservices.gov.in'], statusApiEnv: 'JANSAMARTH_STATUS_API_URL', statusTokenEnv: 'JANSAMARTH_STATUS_API_TOKEN', allowedHostsEnv: 'JANSAMARTH_STATUS_API_ALLOWED_HOSTS', webhookSecretEnv: 'JANSAMARTH_WEBHOOK_SECRET', notes: 'Live status sync requires approved JanSamarth API access.' },
  'pm-svanidhi': { provider: 'PM SVANidhi', portalUrl: 'https://pmsvanidhi.mohua.gov.in/', applicationUrl: 'https://pmsvanidhi.mohua.gov.in/', officialDomains: ['pmsvanidhi.mohua.gov.in'], statusApiEnv: 'PMSVANIDHI_STATUS_API_URL', statusTokenEnv: 'PMSVANIDHI_STATUS_API_TOKEN', allowedHostsEnv: 'PMSVANIDHI_STATUS_API_ALLOWED_HOSTS', webhookSecretEnv: 'PMSVANIDHI_WEBHOOK_SECRET', notes: 'Live status sync requires approved PM SVANidhi API access.' }
};
function getIntegration(schemeId) {
  const aliases = { 'mudra-shishu': 'mudra-shishu', 'mudra-kishor': 'mudra-kishor', 'pm-svanidhi': 'pm-svanidhi' };
  return registry[aliases[schemeId] || schemeId] || { provider: 'Official scheme portal', portalUrl: null, applicationUrl: null, officialDomains: [], statusApiEnv: null, statusTokenEnv: null, allowedHostsEnv: null, webhookSecretEnv: null, notes: 'Official portal handoff is supported. Live status requires an authorized provider integration.' };
}
module.exports = { registry, getIntegration };
