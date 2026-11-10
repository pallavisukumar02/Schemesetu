# SchemeSetu walkthrough and onboarding update

This update addresses the overlapping 3D chapter text and the unwanted `/app` second landing page.

## Updated journey
1. Public dark 3D landing page (`/`).
2. Get started opens the account choice screen (`/start`).
3. New users create an account (`/signup`) and continue to the existing profile form (`/onboarding`).
4. The profile form captures the existing matching inputs, including income range, business type, category and location.
5. Saving the profile opens the existing matched-schemes dashboard (`/dashboard`).
6. Existing users sign in (`/login`) and continue to their dashboard.

`/app` now redirects to `/start`, so it no longer displays the old light landing page. Existing API routes and database schema are retained.

## 3D fix
- The WebGL canvas is layered above the scene background and below the text overlay.
- ScrollTrigger moves the camera through the four room environments.
- Only one chapter is visible at a time; chapter transitions are switched with a single active index to prevent overlapping headlines.
- Removed the component-level Lenis instance to avoid competing with page scroll and ScrollTrigger.

## Run locally
From the `schemesetu_3d_work` project root:

```powershell
npm run install:all
npm run dev
```

Keep the backend and frontend processes running as launched by the root dev script. Back up your existing `schemesetu.db` before replacing project files. The database is not included in this update archive.
