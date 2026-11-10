# SchemeSetu — Host console & public deployment

## 1. Where host data lives

Normal user accounts are stored in the SQLite database file `schemesetu.db` at the project root during local development. The database contains the `users`, `applications`, `application_events`, `notifications`, `sessions`, and `host_sessions` tables.

Passwords are stored as scrypt password hashes, not plaintext. The host console never returns password hashes or normal login session tokens.

## 2. Host console

Open:

`/host`

Example local URL:

`http://localhost:5173/host`

The host console provides:
- total registered users
- tracked applications
- under-review and approved-status counts
- notification count
- searchable user directory
- user detail drawer
- application and notification records for a selected user
- deployment/public-access checks

Host access is separate from normal user login.

Set these server-only variables in `.env`:

```env
HOST_EMAIL=your-host-email@example.com
HOST_PASSWORD=use-a-long-random-password
PUBLIC_ORIGIN=https://your-public-domain.example
NODE_ENV=production
```

Never put `HOST_PASSWORD` in `frontend/.env`, React code, GitHub, or a browser-exposed Vite variable.

## 3. What happens when the URL is public?

The user-facing SchemeSetu application is intentionally public after deployment. Anyone who has the URL can open the public pages and create an account.

The `/host` console is not public data: it requires the server-side host credentials and a private HttpOnly host session cookie.

A public URL does **not** mean that the SQLite database or host credentials are exposed. They remain server-side as long as deployment is configured correctly.

## 4. Local run

```bash
npm run install:all
npm run dev
```

Then open the Vite `Local:` URL.

## 5. Production run

Build the React frontend:

```bash
npm run build
```

Start the Express server:

```bash
npm start
```

When `frontend/dist` exists, Express serves the React app from the same origin and continues serving `/api/*` routes.

## 6. SQLite persistence on a hosting platform

For a public deployment, use a persistent disk/volume for `schemesetu.db` or move the data layer to a managed database such as PostgreSQL. Do not rely on an ephemeral filesystem if you need accounts and application history to survive redeploys.

If the host provides a mounted persistent directory, set for example:

```env
DB_PATH=/var/data/schemesetu.db
```

The backend creates/updates the schema automatically on startup.

## 7. Before making it public

- Use a strong unique `HOST_PASSWORD`.
- Use HTTPS.
- Set `NODE_ENV=production` so auth cookies use `Secure`.
- Set `PUBLIC_ORIGIN` to the real public origin.
- Keep `HOST_*`, JWT/session secrets, and provider credentials server-side.
- Use a persistent database volume or managed database.
- Do not claim that Level 3 government status sync is live unless an authorized official API/webhook is actually configured.
- Review your privacy notice and retention/deletion process before collecting real user data.
