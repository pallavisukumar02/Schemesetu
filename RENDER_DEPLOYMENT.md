# Deploy SchemeSetu to Render (public HTTPS)

This repository is configured as one Node/Express web service. Express serves the built React app and `/api/*` from the same origin, so browser geolocation works on the Render HTTPS URL.

## Deploy
1. Push this project folder to a GitHub repository (repository root must contain `render.yaml`, `package.json`, `backend/`, and `frontend/`).
2. In Render, choose **New → Blueprint** and connect that GitHub repository.
3. Review the Blueprint. It creates a paid Starter web service and a 1 GB persistent disk. The disk keeps SQLite accounts and application history across deploys; don't remove it.
4. Set `HOST_EMAIL` to your private admin email. Render generates `HOST_PASSWORD` and `JWT_SECRET`; copy the generated host password to a password manager.
5. After the first deploy, copy the assigned `https://...onrender.com` URL and set `PUBLIC_ORIGIN` to that exact origin (no trailing slash), then redeploy.
6. Open `https://YOUR-SERVICE.onrender.com/api/health`; it should return `{"ok":true}`. Then open `/banks` and test **Use my location**. Allow the browser prompt.

## Important
- Do not commit `.env`, passwords, tokens, or database files.
- The `starter` service + persistent disk is intentionally configured because the app stores user accounts and application history in SQLite. A free ephemeral service is not a durable production deployment.
- Location permission still depends on each visitor allowing location in their browser/device. Provide manual city/PIN search as a fallback.
- This deployment does not create an official government API connection. Keep official status integrations disabled unless authorized credentials are provided.
