# SchemeSetu team setup

## Start locally
1. Extract this ZIP.
2. Open the extracted `schemesetu-expanded-v6` folder in VS Code.
3. Open Terminal.
4. Run:

```powershell
npm.cmd run install:all
npm.cmd run dev
```

5. Open the `Local:` Vite URL shown in the terminal.

## Demo path
Home → Build my opportunity map → create profile → Dashboard → Why this match → Prepare → Compare → Opportunities → Toolkit → official portal.

## Public demo
If using ngrok, expose the exact Vite port shown in the terminal. Keep the backend and Vite process running while the public link is in use.

## No payment required
The core SchemeSetu chatbot and matching flow work without an external AI API key. Grok is optional and must remain server-side if enabled.


## V7 accounts, persistent tracking and notifications

The V7 backend includes:

- account signup/login with email + phone + password
- passwords stored only as scrypt hashes; plaintext passwords are never stored
- 30-day HttpOnly session cookie so returning users stay signed in
- SQLite tables for users, sessions, applications, application events and notifications
- application reference ID and status timeline
- status-change notification service
- optional Twilio SMS or WhatsApp delivery using environment variables only

### Optional Twilio setup

Set these in the root `.env`:

```text
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+...
TWILIO_SMS_FROM=+...
```

WhatsApp notifications require the user to opt in. Twilio's current WhatsApp documentation also requires explicit opt-in and a configured WhatsApp sender. If Twilio is not configured, SchemeSetu still stores the notification in its database with `demo_pending` status so the core demo works without paid messaging.

Important: SchemeSetu does not automatically know a government's internal application status unless an official status API is integrated. For the prototype, the status timeline is updated through the SchemeSetu tracker; the messaging layer then sends a notification when that status changes.
