# SchemeSetu landing page refresh

The public landing page has been redesigned around SchemeSetu's government-scheme discovery purpose, using the supplied GRAVITY brief only as visual direction (soft gradients, glass-like panels, editorial typography, subtle motion and spacious layout).

## What changed
- Rebuilt `frontend/src/pages/Home.jsx` with SchemeSetu-specific messaging, navigation, match preview, trust strip, journey cards, language section and final CTA.
- Added responsive SchemeSetu landing-page styles to `frontend/src/styles/index.css`.
- Updated the English landing headline and page title/description.
- Preserved existing React Router destinations, language toggle, translation keys for the existing content, and existing backend/API routes.

## Run locally
From the project root:

```bash
npm run install:all
npm run dev
```

The frontend build could not be run in the packaging environment because npm dependency installation timed out. Run `npm run build` locally after dependencies install to verify the production bundle.
