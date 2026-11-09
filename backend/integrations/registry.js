const registry = {
  pmegp: {
    provider: 'PMEGP / KVIC',
    portalUrl: 'https://common-pmegp.msme.gov.in/',
    applicationUrl: 'https://www.kviconline.gov.in/pmegpeportal/',
    officialDomains: ['common-pmegp.msme.gov.in', 'www.kviconline.gov.in', 'pmegp.msme.gov.in'],
    statusApiEnv: 'PMEGP_STATUS_API_URL',
    webhookSecretEnv: 'PMEGP_WEBHOOK_SECRET',
    notes: 'No public applicant-status API endpoint was found in the official material used for this build. Level 3 becomes live after an authorized API/webhook is provided.'
  },
  'standup-india': {
    provider: 'Stand-Up India / JanSamarth',
    portalUrl: 'https://www.jansamarth.in/home',
    applicationUrl: 'https://www.jansamarth.in/home',
    officialDomains: ['www.jansamarth.in', 'jansamarth.in', 'financialservices.gov.in'],
    statusApiEnv: 'JANSAMARTH_STATUS_API_URL',
    webhookSecretEnv: 'JANSAMARTH_WEBHOOK_SECRET',
    notes: 'JanSamarth is an official credit-linked scheme platform. Level 3 requires an authorized integration/API; this project does not scrape or impersonate the government portal.'
  },
  'mudra-shishu': {
    provider: 'MUDRA / JanSamarth',
    portalUrl: 'https://www.jansamarth.in/home',
    applicationUrl: 'https://www.jansamarth.in/home',
    officialDomains: ['www.jansamarth.in', 'jansamarth.in', 'financialservices.gov.in'],
    statusApiEnv: 'JANSAMARTH_STATUS_API_URL',
    webhookSecretEnv: 'JANSAMARTH_WEBHOOK_SECRET',
    notes: 'Use the official JanSamarth route for supported credit-linked schemes. Live status sync requires authorized API/webhook access.'
  }
};

function getIntegration(schemeId) {
  return registry[schemeId] || {
    provider: 'Official scheme portal',
    portalUrl: null,
    applicationUrl: null,
    officialDomains: [],
    statusApiEnv: null,
    webhookSecretEnv: null,
    notes: 'Level 1 official portal handoff is supported. Level 3 needs an authorized status integration from the scheme authority.'
  };
}

module.exports = { registry, getIntegration };
