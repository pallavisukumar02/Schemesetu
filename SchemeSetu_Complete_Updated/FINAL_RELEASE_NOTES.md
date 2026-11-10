# SchemeSetu consolidated release

This archive combines the dark 3D walkthrough and onboarding flow with the latest nearby-bank/GPS implementation.

## Included
- Dark emerald + brass 3D landing walkthrough (Three.js, GSAP ScrollTrigger).
- Start → sign up/sign in → onboarding/business profile → matched schemes/dashboard flow.
- Existing auth, matching, scheme, tracker, preparation, comparison and toolkit routes.
- SchemeSetu chatbot route and UI. Open-ended answers require a valid server-side `GEMINI_API_KEY`; without it, the assistant falls back to limited built-in replies.
- Browser GPS and manual area/PIN search for nearby banks. GPS requires HTTPS or localhost and user permission.
- Nearby bank results from OpenStreetMap Overpass with multiple fallback endpoints and geocoding through Nominatim. These public services can rate-limit or be unavailable.
- Scheme-lender guidance for PMEGP, Stand-Up India and MUDRA. Map presence does not prove branch-level participation, current availability, eligibility, sanction or approval. Confirm with the branch and official scheme portal.

## Run locally (Windows PowerShell)
Use Node.js 22 LTS (supported range is Node 20–22). From the folder containing root `package.json`:

```powershell
npm run install:all
copy .env.example .env
# Edit .env and set a long random JWT_SECRET. Add GEMINI_API_KEY only if you have one.
npm run dev
```

Open the Vite URL printed by the frontend (usually `http://localhost:5173`). Keep both dev processes running.

## Database preservation
This archive does not include a user's live `schemesetu.db` or secrets. Back up the existing database and copy it into the project root only while the backend is stopped. Preserve the matching `-wal` and `-shm` sidecar files together if they exist. Never upload `.env` or API keys to GitHub.

## Verification status
Static source checks and build checks are documented separately. Live GPS, Overpass results, Google Gemini responses, email/SMS delivery and production hosting require the user's permissions, credentials and external services; they cannot be guaranteed by a ZIP alone.


## Application tracking update

- Added source-aware tracker timeline (user-entered vs official provider).
- Added opt-in automatic tracking mode, provider host allowlists, HTTPS-only polling, optional bearer credentials, and a 15-minute background sync worker.
- Added signed HMAC-SHA256 provider webhook handling for PMEGP, JanSamarth-linked MUDRA and PM SVANidhi.
- Added status normalization for action required and disbursed states, event idempotency, sync error visibility, and notification attempts after official status changes.
- Automatic government status remains unavailable until the relevant authority approves and supplies API/webhook access.


## Maps removal update (2026-11-11)
- Removed the nearby banks page, navigation item, map API route, Leaflet UI and map-specific styling.
- Removed Leaflet dependencies from the frontend package manifest.
- The legacy `/banks` URL redirects to the dashboard so old bookmarks do not break.
- Scheme discovery, Gemini assistant, preparation and application tracker remain in the project.
