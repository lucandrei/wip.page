import * as React from "react";
import { addPropertyControls, ControlType } from "framer";

type NowPlayingData = {
  status: "playing" | "paused" | "idle";
  track?: string;
  artists?: string;
  album?: string;
  artwork?: string | null;
  url?: string | null;
  progress_ms?: number;
  duration_ms?: number;
};

export function SpotifyNowPlaying(props: { endpoint: string; refreshSeconds: number }) {
  const { endpoint, refreshSeconds } = props;
  const [data, setData] = React.useState<NowPlayingData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    }
  }

  React.useEffect(() => {
    load();
    const t = setInterval(load, Math.max(5, refreshSeconds) * 1000);
    return () => clearInterval(t);
  }, [endpoint, refreshSeconds]);

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.textBlock}>
          <div style={styles.title}>Spotify</div>
          <div style={styles.subtitle}>Couldn’t load: {error}</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={styles.container}>
        <div style={styles.textBlock}>
          <div style={styles.title}>Loading your vibes…</div>
          <div style={styles.subtitle}>Summoning the aux cord</div>
        </div>
      </div>
    );
  }

  if (data.status === "idle") {
    return (
      <div style={styles.container}>
        <div style={styles.textBlock}>
          <div style={styles.title}>Nothing playing</div>
          <div style={styles.subtitle}>Queue's quiet — moment of zen</div>
        </div>
      </div>
    );
  }

  const progressPct =
    data.status === "playing" && data.progress_ms && data.duration_ms
      ? Math.min(100, Math.round((data.progress_ms / data.duration_ms) * 100))
      : 0;

  return (
    <a href={data.url ?? "#"} style={styles.link} target="_blank" rel="noreferrer">
      <div style={styles.container}>
        {data.artwork && (
          <img src={data.artwork} alt="" style={styles.artwork} />
        )}
        <div style={styles.textBlock}>
          <div style={styles.title}>
            {data.track}
          </div>
          <div style={styles.subtitle}>
            {data.artists} • {data.album}
          </div>
          <div style={styles.badge}>
            {data.status === "playing" ? "Now Playing" : "Last Played"}
          </div>
          {data.status === "playing" && data.duration_ms ? (
            <div style={styles.progressOuter}>
              <div style={{ ...styles.progressInner, width: `${progressPct}%` }} />
            </div>
          ) : null}
        </div>
      </div>
    </a>
  );
}

SpotifyNowPlaying.defaultProps = {
  endpoint: "https://yourapp.vercel.app/api/now-playing/u_xxxxxx",
  refreshSeconds: 15,
};

addPropertyControls(SpotifyNowPlaying, {
  endpoint: { type: ControlType.String, title: "API URL" },
  refreshSeconds: { type: ControlType.Number, title: "Refresh (s)", min: 5, max: 120, step: 5 },
});

const styles: Record<string, React.CSSProperties> = {
  link: { textDecoration: "none", color: "inherit" },
  container: {
    display: "flex",
    gap: 16,
    padding: 16,
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.08)",
    backdropFilter: "blur(6px)",
    alignItems: "center",
  },
  artwork: { width: 64, height: 64, borderRadius: 12, objectFit: "cover" },
  textBlock: { display: "flex", flexDirection: "column", gap: 6 },
  title: { fontSize: 16, fontWeight: 600 },
  subtitle: { fontSize: 12, opacity: 0.8 },
  badge: {
    fontSize: 10,
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.1)",
    width: "fit-content",
  },
  progressOuter: {
    marginTop: 6,
    height: 6,
    width: 200,
    borderRadius: 999,
    background: "rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  progressInner: {
    height: "100%",
    borderRadius: 999,
    background: "black",
    transition: "width 0.3s ease",
  },
};
