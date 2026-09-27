# Mobile installation and offline shell

Run `npm ci && npm run build && npm run preview` with Node.js 20+.
Service workers run in production builds on HTTPS (or localhost), not `npm run dev`.

1. Open the preview URL online and wait for the service worker to activate
   (Chrome DevTools → Application → Service Workers).
2. In Application → Manifest, check the app name, colors, 192/512px icons,
   and maskable safe area. The icons reuse the existing emerald map-pin favicon,
   padded on an opaque `#06080d` background; the Apple icon is 180px.
3. Switch the browser offline and reload. The app shell should render;
   routing, city data, map tiles, and Google sign-in still require a connection.
   API responses and third-party resources are intentionally not cached.
4. Reconnect and use the browser's Install/Add to Home Screen action.
   On iOS Safari, use Share → Add to Home Screen and check the icon and standalone launch.
5. After deploying a new build, close all app tabs/windows and reopen to activate
   the waiting update. An active commute is not reloaded automatically.

Run `node scripts/check-pwa.mjs` after building to check the generated artifacts.
