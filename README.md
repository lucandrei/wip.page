# Framer + Spotify (Multi‑user) — Starter

Make a Framer component that anyone can use to show their “Now Playing / Last Played” from Spotify.

## What’s inside
- `api/connect.mjs` → sends users to Spotify to approve
- `api/callback.mjs` → stores user refresh token in Vercel KV and shows their public API URL
- `api/now-playing/[id].mjs` → public JSON for that user
- `framer/SpotifyNowPlaying.tsx` → drop-in Framer Code Component
- `vercel.json`, `package.json`, `.env.example`

## 0) Prereqs
- Vercel account
- Spotify Developer account

## 1) Create your Spotify app (3 min)
- Go to Spotify Developer Dashboard → create app
- Note Client ID and Client Secret
- Add Redirect URIs:
  - `https://YOUR-APP.vercel.app/api/callback`
  - (optional for local dev) `http://localhost:3000/api/callback`
- Scopes:
  - `user-read-currently-playing`
  - `user-read-recently-played`

## 2) Deploy backend
```bash
npm i -g vercel
vercel login
vercel init  # or 'vercel' in this folder to create a project
```
- Add environment variables in Vercel → Project Settings → Environment Variables:
  - `SPOTIFY_CLIENT_ID`
  - `SPOTIFY_CLIENT_SECRET`
  - `APP_URL` = `https://YOUR-APP.vercel.app`
- Add the **Vercel KV** integration (Marketplace) to the project and redeploy.

Then:
```bash
npm run deploy
```

## 3) Connect a user
- Visit `https://YOUR-APP.vercel.app/api/connect`
- Approve Spotify → you’ll land on a success page with your **public API URL**, e.g.:
  - `https://YOUR-APP.vercel.app/api/now-playing/u_ab12cd`

## 4) Use in Framer
- Add a **Code Component** to your project
- Paste `framer/SpotifyNowPlaying.tsx` contents
- In the component props:
  - **API URL**: paste your public URL from step 3
  - **Refresh (s)**: 15 (reasonable default)

Publish. Done.

## Notes
- Caching: responses are lightly cached (10–15s) to avoid rate limits
- Security: refresh tokens stay in KV; public endpoint exposes only read-only track info
- Rotate/Revoke: delete the `user:ID` key in KV to revoke

## Troubleshooting
- 404 Unknown user → connect step didn’t save; ensure KV integration is added and environment variables are present; redeploy
- “No refresh token” → ensure exact Redirect URI is added in the Spotify app settings
- CORS errors → endpoints send `Access-Control-Allow-Origin: *`
- Nothing playing → you’ll see `status: "paused"` with your last played track, or `idle`
