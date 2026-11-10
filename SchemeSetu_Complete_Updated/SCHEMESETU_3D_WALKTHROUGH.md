# SchemeSetu — 3D Walkthrough update

This version changes the landing page to a dark, immersive visual system and adds a scroll-pinned Three.js walkthrough.

## Visual direction
- Midnight teal / deep charcoal base (`#081516`, `#102322`)
- Muted emerald architecture (`#244b42`, `#82b7a0`)
- Warm brass accents (`#d6a85f`)
- Ivory typography (`#edf0e8`)

## 3D experience
The walkthrough is built from Three.js geometry (no external 3D model download required). It creates four connected room-like spaces with lit architectural ribs, floating opportunity panels, orbit rings and glowing objects. GSAP ScrollTrigger pins the walkthrough while the camera travels through the spaces; Lenis provides smooth scrolling. The four overlays tell the SchemeSetu story: idea, discovery, matching and next steps.

## Run locally
From the project root:

```powershell
npm run install:all
npm run dev
```

The root dev script starts the backend and frontend. Open the Vite URL printed in the frontend terminal (usually `http://localhost:5173`; if occupied, Vite may use `5174`). Keep both terminal processes running.

If you run the frontend separately:

```powershell
cd frontend
npm install
npm run dev
```

The backend remains in `backend/` and the existing routes/pages are retained.

## Notes
- Three.js, GSAP and Lenis are frontend dependencies and are installed by `npm run install:all`.
- The landing-page walkthrough is a custom procedural 3D scene inspired by the reference's scroll-driven room concept. It does not reuse the reference repository's `room.glb` asset.
- WebGL is required for the 3D canvas. If a device has WebGL disabled, the rest of the landing page remains usable.
- This source package has not been run against the user's local environment or deployed to Render. Verify with a local build after dependencies install.
