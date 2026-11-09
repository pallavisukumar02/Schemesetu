# SchemeSetu — AI-assisted scheme readiness platform

SchemeSetu is an offline-first prototype for helping entrepreneurs discover relevant government support and prepare before leaving for an official application portal.

## Core product flow
1. Create a profile once.
2. Get transparent, rule-based scheme matches.
3. See **why** a scheme matched and what to verify.
4. Get an **application readiness** score.
5. Prepare a personalized document checklist.
6. Build a simple business/project outline.
7. Compare opportunities.
8. Explore central schemes and official support resources.
9. Track application progress locally.
10. Continue to the relevant official portal only at the final submission step.

## Included prototype features
- 30 catalog entries: 18 matchable schemes + 12 support/resource entries.
- Explainable matching with non-100% fit scores.
- Why-match and eligibility-gap explanations.
- Application readiness score.
- Document checklist and preparation workspace.
- Business toolkit and illustrative planning calculator.
- Scheme comparison (up to 3).
- Opportunity map: finance, women entrepreneurship, training, food business and support resources.
- Application tracker stored in the browser.
- Official-source link labeling and safety reminders.
- Privacy center and local-data clearing.
- Multilingual UI, voice input, camera capture and nearby-bank flow.
- Offline built-in chatbot guidance; optional Grok enhancement remains backend-only if configured.
- Vite + Express development setup with `/api` proxy.

## Run
From the project root:

```powershell
npm.cmd run install:all
npm.cmd run dev
```

Then open the Vite URL shown in the terminal, normally `http://localhost:5173/`.

The backend runs on `http://localhost:4000` and the Vite dev server proxies `/api` to it.

## Important
Match scores are preliminary fit indicators, not government approval. Scheme rules, documents, deadlines and benefits can change. Always verify current requirements on the official source before submitting an application.


## Account + application tracking (V7)

- SQLite now stores accounts, secure password hashes, 30-day HttpOnly sessions, applications, application events and notification logs.
- Passwords are never stored in plaintext.
- Users can sign in again from the same browser without re-entering their profile.
- Application tracking behaves like an order timeline: matched → preparing → applied → under review → approved/rejected.
- Add an application/reference ID after submitting on the official portal.
- WhatsApp/SMS notifications are optional and disabled until Twilio credentials are added to `.env`.
- WhatsApp notifications require explicit opt-in.
- SchemeSetu cannot know a government department's internal status automatically unless an official status API is integrated; the tracker stores status updates entered by the user/admin workflow.

### Run

```powershell
npm.cmd run install:all
npm.cmd run dev
```

Then open the Vite `Local:` URL and create an account.

## Government connectivity: 3 levels

SchemeSetu now has a transparent three-level architecture:

- **Level 1:** official portal handoff — live.
- **Level 2:** official portal reachability/domain verification — live; this is not private application status.
- **Level 3:** authorized government status API or signed webhook — integration-ready but disabled until official credentials/access are supplied.

See `INTEGRATION_LEVELS.md` and open `/integrations` in the app.

### Nearby banks and location permissions

The Nearby Banks page uses browser geolocation (only after the user presses **Use my location**) and searches OpenStreetMap bank features through the backend Overpass API. If GPS permission is unavailable, users can search by area, city, or PIN code; the backend geocodes that query and performs the same nearby search. The search radius can be set to 2, 5, 10, or 15 km.

- GPS requires HTTPS on a deployed site. `http://localhost` is allowed for local development, but a LAN URL such as `http://192.168.x.x` is not a secure browser context.
- Users must grant location permission in their browser/device. The area/PIN-code search is the fallback when permission is denied.
- Results are OpenStreetMap contributions and may be incomplete or out of date; confirm branch details before visiting.
- Backend endpoints: `GET /api/nearby/banks?lat=<latitude>&lon=<longitude>&radius=5000` and `GET /api/nearby/geocode?q=<area-or-pin-code>`.
