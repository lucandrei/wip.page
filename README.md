# Framer + Spotify (Multi‑user) — Starter (Fixed)

This patch uses `.js` files and a modern `vercel.json` so Vercel picks the Node.js 20 runtime without the legacy "now-php" error.

## Deploy
1) Push this folder to GitHub, then import to Vercel **or** deploy via CLI.
2) Set env vars in Vercel:
   - SPOTIFY_CLIENT_ID
   - SPOTIFY_CLIENT_SECRET
   - APP_URL = https://YOUR-APP.vercel.app
3) Add **Vercel KV** integration to the project (Storage → Add Integration → Vercel KV).
4) In Spotify Dashboard add Redirect URI:
   - https://YOUR-APP.vercel.app/api/callback
5) Visit `/api/connect` and approve. Copy your public URL.
