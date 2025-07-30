import { redis } from "./_redis.js";

export default async function handler(req, res) {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send("Missing authorization code");

    const cookie = req.headers.cookie || "";
    const match = cookie.match(/spotify_state=([^;]+)/);
    const cookieState = match ? match[1] : null;
    if (cookieState && state && cookieState !== state) {
      return res.status(400).send("State mismatch");
    }

    const redirectUri = `${process.env.APP_URL}/api/callback`;
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization":
          "Basic " +
          Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return res.status(500).send(`Token error: ${err}`);
    }

    const data = await tokenRes.json();
    const refresh = data.refresh_token;
    const access = data.access_token;
    if (!refresh) return res.status(500).send("No refresh token received");

    let display = "";
    try {
      const meRes = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${access}` },
      });
      const me = await meRes.json();
      display = me.display_name || me.id || "";
    } catch {}

    const publicId = `u_${Math.random().toString(36).slice(2, 8)}`;
    await redis.hset(`user:${publicId}`, {
      refresh_token: refresh,
      display_name: display,
      created_at: Date.now().toString(),
    });

    const apiUrl = `${process.env.APP_URL}/api/now-playing/${publicId}`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`
      <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding: 40px; line-height: 1.6; }
        code { background: #f5f5f5; padding: 4px 8px; border-radius: 6px; }
        .box { border: 1px solid #eee; border-radius: 12px; padding: 16px; }
      </style>
      <h1>Connected to Spotify ✅</h1>
      <p>${display ? `Hi <b>${display}</b>!` : ""} Your public API URL is:</p>
      <div class="box"><code>${apiUrl}</code></div>
      <p>Paste that URL into the Framer component's <b>API URL</b> field.</p>
      <p><a href="${apiUrl}" target="_blank">Preview the JSON</a></p>
    `);
  } catch (e) {
    res.status(500).send(e?.message ?? "Server error");
  }
}
