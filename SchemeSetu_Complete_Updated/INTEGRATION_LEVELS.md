# SchemeSetu — Government Integration Levels

## Level 1 — Official portal handoff (working)

SchemeSetu performs eligibility matching locally using the scheme rules stored in `schemes.json`, then sends the applicant to the official application portal. SchemeSetu does not submit a government application on the user's behalf.

## Level 2 — Official portal verification (working)

For supported schemes, SchemeSetu checks the configured official portal URL for reachability and verifies that the configured hostname belongs to an allowlisted official domain. This proves that the handoff destination is reachable; it **does not** read a user's private government application status.

## Level 3 — Authorized live status integration (integration-ready)

The backend includes two secure integration paths:

1. **Authorized status API polling**
   - Set an official status API endpoint in `.env`.
   - The endpoint must belong to the allowlisted official domain for the scheme.
   - SchemeSetu sends only the application/reference ID.
   - The endpoint should return JSON such as:
     `{ "status": "under_review", "message": "Application is being assessed" }`
   - SchemeSetu stores the returned status and adds a timeline event.

2. **Signed webhook**
   - An authorized government/integration partner can POST a status event to `/api/integrations/webhook/:provider`.
   - Requests must include `X-SchemeSetu-Signature`, an HMAC-SHA256 signature using the configured webhook secret.
   - The webhook updates the matching application by reference ID.

### Important

The repository intentionally ships with Level 3 **disabled** by default. No undocumented government API is scraped, guessed, reverse-engineered, or impersonated. A real-time government status claim is made only after an authorized API/webhook is supplied by the relevant authority or integration partner.

## Current official-source examples

- JanSamarth is the Department of Financial Services' national portal for credit-linked government schemes and provides application/status workflows for onboarded schemes.
- PMEGP has an official government portal for the scheme and online application ecosystem.

The exact API contract for live status synchronization must come from the relevant authority/integration partner.
