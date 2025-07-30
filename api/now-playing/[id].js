import { redis } from "../_redis.js";

async function getAccessToken(refresh) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization":
        "Basic " +
        Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh,
    }),
  });
  if (!res.ok) throw new Error("Failed to refresh token");
  return res.json();
}

export default async function handler(req, res) {
  try {
    const publicId = req.query.id;
    const user = await kv.hgetall(`user:${publicId}`);
    if (!user) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(404).json({ error: "Unknown user" });
    }

    const { access_token } = await getAccessToken(user.refresh_token);

    let r = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (r.status === 204) {
      r = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=1", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (!r.ok) throw new Error("recently played failed");
      const recent = await r.json();
      const item = recent.items?.[0]?.track;
      res.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate=60");
      res.setHeader("Access-Control-Allow-Origin", "*");
      if (!item) return res.status(200).json({ status: "idle" });
      return res.status(200).json({
        status: "paused",
        track: item.name,
        artists: item.artists.map(a => a.name).join(", "),
        album: item.album.name,
        artwork: item.album.images?.[0]?.url ?? null,
        url: item.external_urls?.spotify ?? null,
      });
    }

    if (!r.ok) throw new Error("currently playing failed");
    const now = await r.json();
    const t = now?.item;
    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=60");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({
      status: "playing",
      track: t?.name,
      artists: t?.artists?.map(a => a.name).join(", "),
      album: t?.album?.name,
      artwork: t?.album?.images?.[0]?.url ?? null,
      url: t?.external_urls?.spotify ?? null,
      progress_ms: now?.progress_ms ?? 0,
      duration_ms: t?.duration_ms ?? 0,
    });
  } catch (e) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).json({ error: e?.message ?? "Server error" });
  }
}
