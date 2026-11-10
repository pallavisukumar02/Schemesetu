# SchemeSetu — consolidated local + GitHub + Render handoff

This folder is the consolidated project snapshot. It combines the Gemini chatbot scheme-status safeguards, the synchronized scheme catalogue, the in-page Leaflet bank finder, and the subtle site-consistent map styling.

## 1. Requirements

- Node.js 22 LTS (the package engine range is Node >=20 and <23)
- npm
- A Gemini API key for online AI answers (optional; the built-in guidance fallback remains available)

## 2. Environment setup

Create a private file named `.env` in this `scheme_work` root by copying `.env.example`.

At minimum:

```env
GEMINI_API_KEY=YOUR_NEW_GEMINI_API_KEY
GEMINI_MODEL=gemini-3.6-flash
JWT_SECRET=replace-with-a-long-random-secret
PUBLIC_ORIGIN=http://localhost:5173
NODE_ENV=development
```

Do not commit `.env`. Never put the Gemini key in `frontend/.env` or in browser code. If a key was exposed in a screenshot or commit, revoke it and create a replacement.

For other optional integrations (Twilio, official application-status APIs), see `backend/.env.example`. Leave optional values blank unless you have credentials and an authorized integration contract.

## 3. Install and run locally

Open the extracted project folder (the folder containing `package.json`). In this release ZIP, `package.json` is at the project root:

```bash
npm run install:all
```

Start both development servers in one terminal:

```bash
npm run dev
```

Or use two terminals:

Terminal 1:

```bash
npm run backend
```

Terminal 2:

```bash
npm run frontend
```

Open the Vite URL printed by the frontend (normally http://localhost:5173). Backend health: http://localhost:4000/api/health. Gemini status: http://localhost:4000/api/chat/status.

For production-mode local build:

```bash
npm run build
npm start
```

The Express server serves `frontend/dist` when it exists.

## 4. Consolidated feature notes

- Landing page, signup/login, onboarding, dashboard, scheme matching, compare, preparation workspace and user-entered application tracker are included in the source snapshot.
- Scheme matching is rule-based and explainable. Closed/resource-only schemes are excluded from active recommendations.
- Mahila e-Haat is marked closed in the canonical catalogue and the frontend public copy is synchronized. Do not use its old portal for registration.
- Gemini runs from the backend only. The browser must never receive `GEMINI_API_KEY`.
- Nearby bank search is independent of schemes. It uses GPS or manual area/PIN search, 5–25 km radius choices, Leaflet/OpenStreetMap markers, and in-page route rendering. It does not open Google Maps in a new tab.
- Bank and map information relies on public OpenStreetMap/Overpass/Nominatim/OSRM services. They can be incomplete, rate-limited or unavailable. This is not an official bank directory; confirm details with branches.
- Browser geolocation requires HTTPS in production. Localhost is allowed for development.
- WhatsApp bot source is an optional Twilio Sandbox prototype. It is not part of the main website process; voice-note functions are stubs and sessions are in-memory. Do not present it as production-ready.
- Application tracking supports user-entered status history, source labels, reference IDs, signed provider webhooks, and a background polling worker. Automatic polling remains disabled until the authority supplies an approved HTTPS API endpoint, authentication details, and an exact allowed hostname. The code does not scrape portals or invent government status.

## 5. Automatic application tracking

The tracker records every user-entered status separately from official-provider events. The background worker checks opted-in applications every 15 minutes only when an authorized provider endpoint is configured. Provider API contract expected by this adapter:

- HTTPS GET to the endpoint configured in `PMEGP_STATUS_API_URL`, `JANSAMARTH_STATUS_API_URL`, or `PMSVANIDHI_STATUS_API_URL`.
- Query parameters: `application_reference` and `scheme_id`.
- Optional `Authorization: Bearer <TOKEN>` from the matching `*_STATUS_API_TOKEN` variable.
- JSON response with `status` (or `application_status` / `stage`), optional `message` / `detail`, and optional unique `event_id`.
- Set the exact API hostname in the matching `*_STATUS_API_ALLOWED_HOSTS` variable. The host must be supplied/approved by the provider.

Signed webhook endpoint: `POST /api/integrations/webhook/:provider` where provider is `pmegp`, `jansamarth`, or `pmsvanidhi`. Sign the exact raw JSON request body with HMAC-SHA256 and send its hex digest in `x-schemesetu-signature`. Required JSON fields: `scheme_id`, `application_reference`, `status`; optional `message`, `event_id`. Use only after the provider authorizes this integration and agrees to the contract. Do not test with real applicant information.

Without that official access, users can still use the working manual tracker and official portal handoff. The application status will not be represented as automatically verified.

## 6. GitHub update

1. Create/confirm the GitHub repository and make a backup branch or commit before replacing files.
2. Upload the contents of this `scheme_work` folder to the repository root (not the outer ZIP folder).
3. Confirm `.env`, `*.db`, `node_modules/`, and `dist/` are excluded by `.gitignore`.
4. Commit and push the source files.

Example Git commands from this folder:

```bash
git init
git add .
git status
# Confirm .env and database files are NOT staged.
git commit -m "Consolidate SchemeSetu chatbot and in-page bank finder"
git branch -M main
git remote add origin https://github.com/OWNER/REPOSITORY.git
git push -u origin main
```

If the repository already has a remote and history, do not run `git init` or add a second remote. Use `git status`, `git remote -v`, then commit and push to the existing branch.

## 7. Render deployment

The included `render.yaml` defines a free Node web service that builds the frontend and starts the Express backend. Free Render filesystems are ephemeral: this is suitable for a public demo, not durable multi-user accounts. Use a persistent disk on a paid Render service or migrate the database to managed PostgreSQL before production use. Connect the GitHub repository in Render and deploy the branch after pushing.

Set these environment variables in the Render service dashboard:

- `GEMINI_API_KEY` — a fresh secret key
- `GEMINI_MODEL` — `gemini-3.6-flash`
- `JWT_SECRET` — a long random secret (Render can generate one)
- `PUBLIC_ORIGIN` — your Render HTTPS service URL
- `NODE_ENV` — `production`

Keep Twilio and official API variables unset unless actually configured. Do not put secrets in GitHub or `render.yaml`.

**Important database limitation:** this snapshot uses SQLite by default. A free Render web service has an ephemeral filesystem, so local SQLite data can be lost on redeploy/restart. A persistent Render disk requires a paid plan; for a multi-user public production app, migrate SQLite to managed PostgreSQL before relying on persistent user accounts and tracker records. Do not assume the free service is durable.

After deploy, verify:

- `https://YOUR-SERVICE.onrender.com/api/health`
- `https://YOUR-SERVICE.onrender.com/api/chat/status`
- signup/login, scheme matching, and the in-page bank map on HTTPS

A successful build does not prove every third-party API is available. Test the full flows on the deployed URL.
