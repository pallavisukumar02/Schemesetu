# Run SchemeSetu first (Windows)

## 1. Open the correct folder

Extract this ZIP. In VS Code choose **File → Open Folder** and select the extracted `SchemeSetu_Complete_Updated` folder. You must see `package.json`, `backend`, `frontend`, `database`, and `scripts` directly in the Explorer. Do not open an outer Downloads folder.

## 2. Check Node.js

Use Node.js 22 LTS. In the VS Code terminal run:

```powershell
node -v
npm -v
```

## 3. Create your private environment file

In the project root terminal:

```powershell
Copy-Item .env.example .env
```

Open `.env`. Add your NEW Gemini API key after revoking any key that was visible in a screenshot or shared publicly. Keep the key in this root `.env` only. Do not paste it into frontend files or GitHub.

```env
GEMINI_API_KEY=YOUR_NEW_KEY
GEMINI_MODEL=gemini-3.6-flash
JWT_SECRET=use-a-long-random-private-value
PUBLIC_ORIGIN=http://localhost:5173
NODE_ENV=development
```

## 4. Install dependencies

Run this from the same folder that contains the root `package.json`:

```powershell
npm run install:all
```

Wait for it to finish. If `better-sqlite3` fails to install, use Node.js 22 LTS (not Node 24), close VS Code, reopen it, delete `backend/node_modules` if it exists, then run the install command again.

## 5. Start the complete website

```powershell
npm run dev
```

Keep this terminal open. Open the frontend URL printed by Vite, normally:

`http://localhost:5173`

The backend runs on `http://localhost:4000`. Health check:

`http://localhost:4000/api/health`

Gemini connection check:

`http://localhost:4000/api/chat/status`

To stop both development servers, click the terminal and press **Ctrl + C**.

## 6. Application tracker behavior

- Manual tracking works without any government integration. The user adds the official application reference and records updates; the timeline labels them as user-entered.
- Automatic tracking is opt-in and appears only after the authority has supplied an approved API/webhook contract, endpoint, authentication and allowed hostname.
- The backend background worker checks opted-in applications every 15 minutes by default. A signed provider webhook can also update a status.
- Portal reachability is not application-status verification. SchemeSetu never scrapes a portal or fabricates approval/rejection.

## 7. GitHub safety

Before pushing, check:

```powershell
git status
```

Confirm `.env`, `*.db`, `node_modules`, and `dist` are not staged. Commit the source and `.env.example`, never `.env`.

## 8. Render warning

The included Render free service is suitable for a demo, but its filesystem is ephemeral. SQLite user accounts and tracker records may be lost after restart/redeploy. Use a persistent disk on a paid Render service or move to managed PostgreSQL before relying on it for real public users. Set secrets in Render's Environment dashboard, not in GitHub.
