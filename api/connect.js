import crypto from "crypto";

export default async function handler(req, res) {
  try {
    const state = crypto.randomBytes(8).toString("hex");
    const redirectUri = `${process.env.APP_URL}/api/callback`;
    const scopes = [
      "user-read-currently-playing",
      "user-read-recently-played",
    ].join(" ");

    const url = new URL("https://accounts.spotify.com/authorize");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", process.env.SPOTIFY_CLIENT_ID);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", scopes);
    url.searchParams.set("state", state);

    res.setHeader("Set-Cookie", `spotify_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
    res.status(302).setHeader("Location", url.toString()).end();
  } catch (e) {
    res.status(500).send(e?.message ?? "Server error");
  }
}
