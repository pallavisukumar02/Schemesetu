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


## Free Render demo deployment (no paid Blueprint required)

You can create a Web Service manually from the GitHub repository instead of creating a paid Blueprint:
- Runtime: Node
- Build command: `npm run install:all && npm run build`
- Start command: `npm start`
- Health check path: `/api/health`
- Instance plan: Free (if available on your Render account)

Set these environment variables in the service:
- `NODE_ENV` = `production`
- `JWT_SECRET` = a long random secret
- `HOST_EMAIL` = your private admin email
- `HOST_PASSWORD` = a strong private password
- `PUBLIC_ORIGIN` = the final `https://...onrender.com` URL
- `GEMINI_API_KEY` = your Google Gemini API key (keep secret; never put it in frontend variables)
- `GEMINI_MODEL` = `gemini-3.8-flash` (change only to a model enabled for your Google Gemini account)

Important limitations:
- This free-demo configuration uses SQLite on the service filesystem. Free instances have ephemeral storage; user accounts and application records may be lost on restart/redeploy or service spin-down. Do not use it for real customer records until a persistent database is configured.
- The AI assistant requires a valid Google Gemini API key and model access. Without it, the chatbot deliberately reports that it is in basic/offline guidance mode; it cannot answer arbitrary questions with an LLM.
- Nearby bank locations are OpenStreetMap results. They do not prove a branch currently offers or has availability for a specific government scheme. That requires verified bank/branch data or an authorized bank integration.
- Browser GPS works on the deployed HTTPS URL only after the visitor grants location permission. If permission was previously blocked, the visitor must re-enable it in the browser site settings.
